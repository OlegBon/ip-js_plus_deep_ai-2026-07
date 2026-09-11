# Backend / server: від HTTP-запиту до результату

## 1. Межа та шари server-коду

У Convertly Hub backend розташований у Next.js Route Handlers `app/api/**/route.ts`.
Кожен handler має бути тонкою HTTP-межею: аутентифікувати запит,
розібрати дані, викликати `lib/**`, перетворити очікувану помилку на HTTP status і
не розкрити секрети. Бізнес-ланцюжки розташовані у `lib/`.

```text
Request
  → app/api/.../route.ts       HTTP + auth + response
  → lib/api or lib/auth        вхідна валідація та principal
  → lib/billing / lib/core     правила тарифу та конвертація
  → lib/privacy / lib/storage  приватний файл
  → lib/prisma.ts              PostgreSQL adapter
```

`runtime = 'nodejs'` потрібен routes, що використовують `Buffer`, `sharp`, bcrypt
або Node SMTP/S3 libraries. Їх не можна без перевірки переносити до Edge runtime.

## 2. Аутентифікація та авторизація

### Web session

[`lib/auth/options.ts`](../../lib/auth/options.ts) створює NextAuth Credentials
Provider. `authorize` делегує перевірку до `lib/auth/users.ts`; до JWT записуються
`id` і `role`, а callback `session` переносить їх до `session.user`.

```ts
session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
cookies: {
  sessionToken: {
    name: isProduction ? '__Secure-convertly-hub.session-token' : 'convertly-hub.session-token',
    options: { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' },
  },
},
```

Код клієнта ніколи не отримує password hash або `NEXTAUTH_SECRET`. Server-only
helpers `lib/auth/session.ts` і `lib/auth/authorization.ts` отримують поточного
користувача та застосовують перевірки `ACTIVE`/`ADMIN`. UI hide/show не є
authorization: ту саму вимогу повторено у handler і server layout.

### API key principal

[`lib/api/conversion-request.ts`](../../lib/api/conversion-request.ts) витягує
Bearer key, хешує його та шукає лише активний ключ. У `/api/v1/convert` це
має такий вигляд:

```ts
const principal = await authenticateApiKey(request.headers.get('authorization'));
if (!principal?.apiKeyId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

if (!getPlanDefinition(principal.plan ?? 'FREE').apiAccess) {
  return NextResponse.json(
    { error: 'API access requires a Basic plan or higher.' },
    { status: 403 },
  );
}
```

Secret існує лише в момент створення ключа. `ApiKey.keyHash` і `keyPrefix`
дають змогу перевірити та відобразити ключ без можливості його відновити.

## 3. Канонічний flow: API-конвертація

Файл [`app/api/v1/convert/route.ts`](../../app/api/v1/convert/route.ts) — гарний
приклад усього серверного ланцюжка.

### Крок 1. Early rejection

Спочатку handler перевіряє API key, право тарифу, in-memory rate limit і
`multipart/form-data`. Це важливо зробити до читання `request.formData()` і до
`file.arrayBuffer()`: так запит без права не витрачає пам'ять на файл.

```ts
const rateLimit = consumeApiKeyRateLimit(principal.apiKeyId);
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Too many conversion requests. Try again later.' },
    { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
  );
}
```

Поточний limiter зберігається у пам'яті процесу (`lib/api/rate-limit.ts`). Він достатній
для однієї VM MVP, але перед кількома instances має бути замінений спільним Redis
backend, інакше кожен instance матиме власне вікно ліміту.

### Крок 2. Дві незалежні перевірки файлу

[`lib/api/conversion-request.ts`](../../lib/api/conversion-request.ts) перевіряє
`File`, target format, allowlist і size для плану. Потім handler читає buffer і
викликає [`lib/core/conversion.ts`](../../lib/core/conversion.ts): Core перевіряє
сигнатуру/вміст і сумісність напряму. Не довіряйте браузерному MIME,
розширенню або react-dropzone.

Помилки навмисно відрізняються:

| Випадок                                        | HTTP  |
| --------------------------------------------- | ----- |
| немає/неправильний ключ                       | `401` |
| API недоступне для плану                      | `403` |
| надто великий файл                            | `413` |
| недозволене джерело/не multipart              | `415` |
| непідтримувана пара форматів або пошкоджений файл | `422` |
| місячна квота конвертацій                     | `429` |

### Крок 3. Атомарне створення request і квота

`createConversionRequest(principal, input)` створює `ConversionLog` зі статусом
`PENDING` і перевіряє місячний ліміт. Для browser-account route додатково
передається SHA-256 source file та `reuseStoredResult: true`, щоб не виконувати ще
одну однакову доступну конвертацію.

За `storeConversions=true` handler повертає лише metadata:

```ts
after(() => processConversionJob(job));
return NextResponse.json(
  {
    conversionId: result.conversion.id,
    status: result.conversion.status,
    createdAt: result.conversion.createdAt.toISOString(),
  },
  { status: 202 },
);
```

`after()` дає змогу повернути `202` до важкої роботи. Це не зовнішня черга:
в одному process задача виконується після response. Для довготривалих/retryable
jobs знадобиться окрема queue/worker — це майбутня архітектурна задача.

За `storeConversions=false` handler синхронно запускає job і повертає
`Content-Disposition: attachment`; ані `storageKey`, ані S3-object не створюються.

## 4. `processConversionJob`: стан, Core та компенсація

[`lib/core/conversion-job.ts`](../../lib/core/conversion-job.ts) — центральний
orchestrator. Він спочатку виконує compare-and-set:

```ts
const started = await prisma.conversionLog.updateMany({
  where: { id: conversionId, status: 'PENDING' },
  data: { status: 'PROCESSING', startedAt: new Date(), errorMessage: null },
});
if (started.count === 0) return undefined;
```

Це не дає двом паралельним викликам обробити один `PENDING` log. Далі:

1. `convertFile()` обирає `sharp` для `JPG ↔ PNG` або Gotenberg для `DOCX → PDF`.
2. Якщо результат потрібно зберігати, `reserveStorageCapacity()` у транзакції
   резервує bytes, не даючи двом jobs одночасно перевищити quota.
3. `storeConversionResult()` генерує private storage key і записує object через
   `lib/storage/s3.ts`.
4. `ConversionLog` стає `COMPLETED`, отримує назву, MIME, розмір, key та
   `expiresAt` з plan retention.
5. За помилки storage object видаляється як compensating action, reservation
   очищується, log стає `FAILED`, а користувачу видається безпечний текст
   без внутрішніх stack traces.

Storage layer навмисно використовує нейтральний S3-compatible контракт, хоча
історичні назви змінних починаються з `MINIO_`: endpoint, access key,
secret key і bucket залишаються server-only. `S3_REGION` має default `us-east-1`
для локального й Oracle MinIO; managed provider, наприклад Supabase, отримує
свій точний регіон. Клієнтський код і Route Handlers цих credentials не бачать.

## 5. Account і guest routes: чим відрізняються

### Account browser flow

[`app/api/account/conversions/route.ts`](../../app/api/account/conversions/route.ts)
потребує HttpOnly session. Він використовує ту саму Core/request logic, що API, але не
приймає API key. Збережений результат завантажується лише у власному account route:

```text
GET /api/account/conversions/:conversionId/download
```

Handler перевіряє власника `userId`, завершений статус, `storageKey` та expiry,
після чого stream-ить object із S3. Пряма public URL не видається.

### Guest flow

[`app/api/guest/conversions/route.ts`](../../app/api/guest/conversions/route.ts)
створює анонімний visitor token у HttpOnly cookie, хешує його та враховує місяць у
`GuestConversionQuota`. Доступні лише guest limits і 1 MB. У guest немає `User`,
`Subscription`, `ConversionLog` і storage object; бінарний result повертається
одразу, а браузер зберігає його тимчасово.

## 6. Інші server domains

| Domain             | Основні файли                                                              | Відповідальність                                                                             |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Реєстрація/пароль | `lib/auth/users.ts`, `recovery.ts`, `password-policy.ts`, `app/api/auth/**` | bcrypt, one-time tokens, neutral reset responses                                            |
| Пошта              | `lib/mail/send-auth-email.ts`                                               | verification/reset SMTP; MailHog лише локально                                              |
| Профіль            | `app/api/account/profile`, `email`, `password`, `preferences`               | current-password confirmation, pending email, privacy                                       |
| Telegram           | `lib/telegram/linking.ts`, `bot.ts`, `app/api/telegram/webhook`             | one-time secure linking, username normalization та reset лише у підтверджений active chat |
| Тарифи             | `lib/billing/plans.ts`, `subscriptions.ts`, `quota-lock.ts`                 | plan definition, mock checkout, monthly/storage quota                                       |
| Адмін              | `lib/admin/*.ts`, `app/api/admin/**`                                        | `ADMIN`-only search/status/key revoke/metrics                                               |
| Health             | `app/api/health/route.ts`                                                   | read-only PostgreSQL, S3 та Gotenberg status                                                 |

### 6.1. Password reset і Telegram: два delivery channel, один security contract

`app/api/auth/password-reset/request/route.ts` приймає email або
`@username`, нормалізує contact і завжди повертає нейтральний `202`: не можна
за HTTP-відповіддю дізнатися, чи існує користувач. За дозволеного запиту
`lib/auth/recovery.ts` зберігає лише hash одноразового токена та TTL. Потім
route обирає канал доставки:

```text
email → lib/mail/send-auth-email.ts → SMTP
@username → verified telegramId → lib/telegram/bot.ts → Telegram Bot API
```

Username сам собою не доводить володіння chat: `createTelegramPasswordReset`
потребує одночасно `telegramId`, `telegramVerified` і `UserStatus.ACTIVE`.
Webhook `POST /api/telegram/webhook` спочатку перевіряє заголовок
`x-telegram-bot-api-secret-token`, приймає link-команду лише з private
chat і лише потім передає `/start link_<token>` до `verifyTelegramLink`.
Нове pending-посилання не скасовує попередню підтверджену прив'язку. Owner-scoped
`DELETE /api/account/telegram/link` очищує Telegram поля та pending token, після
чого recovery за `@username` залишається нейтрально недоступним. Токени, bot token,
chat ID, URL reset-посилання та provider response не мають потрапляти до
користувацького JSON або звичайних логів.

### 6.2. Account deletion: request не дорівнює негайному видаленню

Користувацький `POST /api/account/deletion-request` викликає
`createAccountDeletionRequest`. Він створює `PENDING` request і append-only
`REQUESTED` event; повторний активний request не створюється. Скасування дозволене
лише поки request `PENDING`.

Адміністративні endpoints використовують `lib/account-deletion/workflow.ts` і роблять
стани явними:

```text
PENDING → PROCESSING → COMPLETED
                     └→ FAILED
PENDING → CANCELLED
```

`processAccountDeletionRequest` спочатку атомарно claim-ить request у
`PROCESSING`, потім видаляє private S3 objects користувача й лише після цього
видаляє `User`. Prisma каскадно видаляє пов'язані account records, а
`AccountDeletionRequest` зберігається з `userId = null` для audit trail. Якщо
storage або видалення не завершилося, request стає `FAILED`, створюється
event і адміністратор може виконати controlled retry. SMTP-сповіщення на
support mailbox best-effort: їхня помилка логується, але не скасовує вже коректно
виконану операцію з даними.

Повні статуси, права та ручна перевірка розташовані у
[account-deletion-workflow.md](../account-deletion-workflow.md).

## 7. Безпечний порядок backend-зміни

1. Опишіть вхід/вихід та auth requirement у `docs/architecture.md` і UI docs.
2. Створіть/розширте pure helper у `lib/`; handler не має містити всю логіку.
3. Валідуйте input на HTTP-межі, але повторіть критичні перевірки у Core.
4. Не повертайте password hash, verification/reset token, API secret або
   provider error у JSON/log, доступний користувачу.
5. Для Telegram recovery зіставляйте `@username` лише як зручний lookup:
   право доставки reset-посилання підтверджує збережений chat ID, а не ім'я
   користувача. Bot token, webhook secret, chat ID і reset URL не логуються.
6. Якщо змінюються дані — спочатку Prisma schema/migration і database guide.
7. Додайте route/unit test, а потім за наскрізного контракту — integration/E2E.

Пов'язані моделі та транзакції: [database.md](./database.md).

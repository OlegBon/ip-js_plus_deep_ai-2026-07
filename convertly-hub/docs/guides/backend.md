# Backend / server: от HTTP-запроса до результата

## 1. Граница и слои server-кода

В Convertly Hub backend находится в Next.js Route Handlers `app/api/**/route.ts`.
Каждый handler должен быть тонкой HTTP-границей: аутентифицировать запрос,
распарсить данные, вызвать `lib/**`, перевести ожидаемую ошибку в HTTP status и
не раскрыть секреты. Бизнес-цепочки находятся в `lib/`.

```text
Request
  → app/api/.../route.ts       HTTP + auth + response
  → lib/api or lib/auth        входная валидация и principal
  → lib/billing / lib/core     правила тарифа и конвертация
  → lib/privacy / lib/storage  приватный файл
  → lib/prisma.ts              PostgreSQL adapter
```

`runtime = 'nodejs'` нужен routes, которые используют `Buffer`, `sharp`, bcrypt
или Node SMTP/S3 libraries. Их нельзя без проверки переносить в Edge runtime.

## 2. Аутентификация и авторизация

### Web session

[`lib/auth/options.ts`](../../lib/auth/options.ts) создаёт NextAuth Credentials
Provider. `authorize` делегирует проверку в `lib/auth/users.ts`; в JWT записываются
`id` и `role`, а callback `session` переносит их в `session.user`.

```ts
session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
cookies: {
  sessionToken: {
    name: isProduction ? '__Secure-convertly-hub.session-token' : 'convertly-hub.session-token',
    options: { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' },
  },
},
```

Код клиента никогда не получает password hash или `NEXTAUTH_SECRET`. Server-only
helpers `lib/auth/session.ts` и `lib/auth/authorization.ts` достают текущего
пользователя и применяют `ACTIVE`/`ADMIN` проверки. UI hide/show не является
authorization: то же требование повторяется в handler и server layout.

### API key principal

[`lib/api/conversion-request.ts`](../../lib/api/conversion-request.ts) извлекает
Bearer key, хеширует его и ищет только активный ключ. В `/api/v1/convert` это
выглядит так:

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

Secret существует только в момент создания ключа. `ApiKey.keyHash` и `keyPrefix`
позволяют проверить и отобразить ключ без возможности его восстановить.

## 3. Канонический flow: API-конвертация

Файл [`app/api/v1/convert/route.ts`](../../app/api/v1/convert/route.ts) — хороший
пример всей серверной цепочки.

### Шаг 1. Early rejection

Сначала handler проверяет API key, право тарифа, in-memory rate limit и
`multipart/form-data`. Это важно сделать до чтения `request.formData()` и до
`file.arrayBuffer()`: так запрос без права не расходует память на файл.

```ts
const rateLimit = consumeApiKeyRateLimit(principal.apiKeyId);
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Too many conversion requests. Try again later.' },
    { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
  );
}
```

Текущий limiter хранится в памяти процесса (`lib/api/rate-limit.ts`). Он достаточен
для одной VM MVP, но перед несколькими instances должен быть заменён общим Redis
backend, иначе у каждого instance появится своё окно лимита.

### Шаг 2. Две независимые проверки файла

[`lib/api/conversion-request.ts`](../../lib/api/conversion-request.ts) проверяет
`File`, target format, allowlist и size для плана. Затем handler читает buffer и
вызывает [`lib/core/conversion.ts`](../../lib/core/conversion.ts): Core проверяет
сигнатуру/содержимое и совместимость направления. Не доверяйте браузерному MIME,
расширению или react-dropzone.

Ошибки намеренно различаются:

| Случай                                        | HTTP  |
| --------------------------------------------- | ----- |
| нет/неверный ключ                             | `401` |
| API недоступно плану                          | `403` |
| слишком большой файл                          | `413` |
| неразрешённый источник/не multipart           | `415` |
| неподдерживаемая пара форматов или битый файл | `422` |
| месячная квота конвертаций                    | `429` |

### Шаг 3. Атомарное создание request и квота

`createConversionRequest(principal, input)` создаёт `ConversionLog` со статусом
`PENDING` и проверяет месячный лимит. Для browser-account route дополнительно
передаётся SHA-256 source file и `reuseStoredResult: true`, чтобы не делать ещё
одну одинаковую доступную конвертацию.

При `storeConversions=true` handler возвращает только metadata:

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

`after()` позволяет отдать `202` прежде тяжёлой работы. Это не внешняя очередь:
на одном process задача выполняется после response. Для долговременных/retryable
jobs понадобится отдельная queue/worker — это будущая архитектурная задача.

При `storeConversions=false` handler синхронно запускает job и возвращает
`Content-Disposition: attachment`; ни `storageKey`, ни S3-object не создаются.

## 4. `processConversionJob`: состояние, Core и компенсация

[`lib/core/conversion-job.ts`](../../lib/core/conversion-job.ts) — центральный
orchestrator. Он сначала делает compare-and-set:

```ts
const started = await prisma.conversionLog.updateMany({
  where: { id: conversionId, status: 'PENDING' },
  data: { status: 'PROCESSING', startedAt: new Date(), errorMessage: null },
});
if (started.count === 0) return undefined;
```

Это не позволяет двум параллельным вызовам обработать один `PENDING` log. Затем:

1. `convertFile()` выбирает `sharp` для `JPG ↔ PNG` или Gotenberg для `DOCX → PDF`.
2. Если результат нужно хранить, `reserveStorageCapacity()` под транзакцией
   резервирует bytes, не позволяя двум jobs превысить quota одновременно.
3. `storeConversionResult()` генерирует private storage key и пишет object через
   `lib/storage/s3.ts`.
4. `ConversionLog` становится `COMPLETED`, получает имя, MIME, размер, key и
   `expiresAt` из plan retention.
5. При ошибке storage object удаляется как compensating action, reservation
   очищается, log становится `FAILED`, а пользователю выдаётся безопасный текст
   без внутренних stack traces.

## 5. Account и guest routes: чем отличаются

### Account browser flow

[`app/api/account/conversions/route.ts`](../../app/api/account/conversions/route.ts)
требует HttpOnly session. Он использует тот же Core/request logic, что API, но не
принимает API key. Сохранённый результат скачивается только в своём account route:

```text
GET /api/account/conversions/:conversionId/download
```

Handler проверяет владельца `userId`, завершённый статус, `storageKey` и expiry,
после чего stream-ит object из S3. Прямая public URL не выдаётся.

### Guest flow

[`app/api/guest/conversions/route.ts`](../../app/api/guest/conversions/route.ts)
создаёт анонимный visitor token в HttpOnly cookie, хеширует его и учитывает месяц в
`GuestConversionQuota`. Доступны ровно guest limits и 1 MB. У guest нет `User`,
`Subscription`, `ConversionLog` и storage object; бинарный result возвращается
сразу, а браузер хранит его временно.

## 6. Другие server domains

| Domain             | Основные файлы                                                              | Ответственность                                           |
| ------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Регистрация/пароль | `lib/auth/users.ts`, `recovery.ts`, `password-policy.ts`, `app/api/auth/**` | bcrypt, one-time tokens, neutral reset responses          |
| Письма             | `lib/mail/send-auth-email.ts`                                               | verification/reset SMTP; MailHog только локально          |
| Профиль            | `app/api/account/profile`, `email`, `password`, `preferences`               | current-password confirmation, pending email, privacy     |
| Telegram           | `lib/telegram/linking.ts`, `app/api/telegram/webhook`                       | one-time secure linking; Telegram reset ещё не реализован |
| Тарифы             | `lib/billing/plans.ts`, `subscriptions.ts`, `quota-lock.ts`                 | plan definition, mock checkout, monthly/storage quota     |
| Админ              | `lib/admin/*.ts`, `app/api/admin/**`                                        | `ADMIN`-only search/status/key revoke/metrics             |
| Health             | `app/api/health/route.ts`                                                   | read-only PostgreSQL, S3 и Gotenberg status               |

## 7. Безопасный порядок backend-изменения

1. Опишите вход/выход и auth requirement в `docs/architecture.md` и UI docs.
2. Создайте/расширьте pure helper в `lib/`; handler не должен содержать всю логику.
3. Валидируйте input на HTTP-границе, но повторите критичные проверки в Core.
4. Не возвращайте password hash, verification/reset token, API secret или
   provider error в JSON/log, доступный пользователю.
5. Если меняются данные — сначала Prisma schema/migration и database guide.
6. Добавьте route/unit test, затем при сквозном контракте — integration/E2E.

Связанные модели и транзакции: [database.md](./database.md).

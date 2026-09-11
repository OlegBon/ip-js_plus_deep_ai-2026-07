# Demo MVP на Northflank Developer Sandbox + Supabase Free

Цей runbook розгортає **функціональний публічний demo MVP**, а не production:
Next.js, реєстрація, реальний SMTP, `JPG ↔ PNG`, `DOCX → PDF`, Dashboard,
API-ключі, private storage й Admin Panel працюють. Він не створює облікові записи,
секрети, DNS-записи чи ресурси сам по собі.

Практичні дії у панелях — від реєстрації до оновлення застосунку після
`git push` — описано в окремому
[покроковому setup guide](./northflank-supabase-setup.md). Цей документ залишає
за собою схему, рішення та експлуатаційні межі.

> Станом на 2 вересня 2026 Northflank Developer Sandbox допускає 2 services, 2 jobs і
> 1 addon, але сам provider зазначає, що free tier не можна використовувати для
> production applications. Supabase Free надає 500 MB PostgreSQL і 1 GB Storage, а
> за низької активності може призупинити project через 7 днів. Тому це
> демонстраційний контур із реальними функціями, але без SLA, production backup і
> обіцянки постійної доступності.

Основним production-планом лишається
[Oracle Cloud Free Tier](./oracle-production-deployment.md). Платні альтернативи
описано у [Vercel](./vercel-production-deployment.md) та
[Render](./render-production-deployment.md).

## 1. Підсумкова схема: не об'єднуємо процеси

```text
Internet
  └─ https://convertly-hub.bon.kharkov.ua
       └─ Northflank service `convertly-app` (Next.js, public :3001)
            ├─ Northflank service `convertly-gotenberg` (private :3000)
            ├─ Supabase PostgreSQL (private credentials from app only)
            ├─ Supabase Storage private bucket via S3 API
            └─ uh.ua SMTP: support@bon.kharkov.ua
```

Чому саме так:

- обидва Northflank services зайняті саме за призначенням free tier: app і Gotenberg;
- PostgreSQL та S3 Storage розміщені в одному Supabase project — MinIO не потрібен;
- Gotenberg не має public port і недоступний зовнішньому клієнту;
- Next.js продовжує використовувати звичний `lib/storage/s3.ts`; він працює з
  Supabase S3-compatible endpoint через AWS SDK v3;
- не потрібен контейнер із `supervisord`, у якому Gotenberg і MinIO ділять пам'ять,
  restart і health state.

Не замінюйте цю схему варіантом `Gotenberg + MinIO` в одному container, доки не
потрібен окремий навчальний експеримент. У нього спільна точка відмови, потрібні
persistent volume і додатковий процес-supervisor, тоді як цей demo вже
вкладається у два services без цих ризиків.

## 2. Що підготовлено в репозиторії

- [`Dockerfile`](../Dockerfile) має standalone target `runner` для Next.js і
  самостійний target `migration` з Prisma CLI.
- `S3_REGION` — server-only змінна. Значення за замовчуванням `us-east-1`
  зберігає локальний MinIO й Oracle без змін; для Supabase задається регіон
  конкретного Supabase project.
- [`lib/storage/s3.ts`](../lib/storage/s3.ts) використовує endpoint, region,
  access key, secret key і bucket з environment, із `forcePathStyle: true`.
- `.env.example` та `.env.production.example` містять безпечну назву
  `S3_REGION`, але не значення cloud credentials.

На цьому етапі не додається `northflank.yaml`: Northflank build configuration
містить секрети та вибраний compute plan у панелі. Фіктивний manifest у Git міг
би створити хибне враження, що його застосовано, або не збігтися з актуальною
схемою provider. Важливі відтворювані поля наведено нижче.

## 3. Preflight до створення сервісів

1. GitHub Actions на цільовому commit `main` мають бути успішними.
2. Локально виконайте `npm audit --omit=dev`; не застосовуйте
   `npm audit fix --force`.
3. Підготуйте лише значення для безпечного введення у панелі, не до Git:
- новий `NEXTAUTH_SECRET` (`openssl rand -base64 48`);
- SMTP host/port/TLS/password скриньки `support@bon.kharkov.ua`;
- Supabase database URI та S3 access key/secret;
- точний Supabase region і project ref;
- domain `convertly-hub.bon.kharkov.ua`.
4. Не використовуйте локальний `.env` як cloud template: у ньому localhost адреси та
   інші секрети. До Northflank/Supabase вводяться нові значення.

## 4. Supabase: один project для PostgreSQL і Storage

### 4.1. Створити проєкт

1. Створіть один Supabase Free project у європейському регіоні, найближчому до
   Northflank project. Запишіть **точну** відображувану назву регіону — вона стане
   `S3_REGION`; не підставляйте регіон «на око».
2. Скопіюйте database connection string для server-side Prisma. Спочатку
   використовуйте direct connection; якщо вибраний network path потребує pooler,
   перевірте Prisma adapter `pg` у smoke-test до перемикання DNS.
3. Не вмикайте Supabase Auth у застосунку: Convertly Hub використовує власні
   NextAuth, `User` table і bcrypt. Не підключайте Supabase client у browser.

### 4.2. Створити private S3 bucket

1. У Storage увімкніть **S3 protocol** і створіть private bucket
   `convertly-files` вручную.
2. У Storage S3 Configuration створіть окрему server-only access key pair.
   Secret буде показано один раз; збережіть його лише у Northflank secret group.
3. Скопіюйте endpoint у формі:

   ```text
   https://<project-ref>.storage.supabase.co/storage/v1/s3
   ```

4. Bucket не має бути public. RLS тут не замінює код застосунку: server
   credential має широкі S3-права, тому owner checks у download Route
   Handlers лишаються обов'язковими.

`HeadBucket`, upload, download і delete, що використовуються поточним AWS SDK layer,
підтримуються Supabase S3 API. Object lifecycle rules через S3 endpoint не
вважаються налаштованими цим runbook; спливлий `expiresAt` уже забороняє download
у застосунку, але автоматичне фізичне видалення результатів — окрема
майбутня задача. Для demo контролюйте малий обсяг Storage вручну.

## 5. Northflank: проєкт і сервіси

Створіть **один** Northflank project у максимально близькому EU region. Private
networking діє лише всередині одного project, тому app і Gotenberg не можна
рознести по різних projects.

### 5.1. Public app service `convertly-app`

Створіть **Combined Service** із GitHub repository і гілки `main`.

Критичні Build Options для монорепозиторію з кількома домашніми проєктами:

```text
Build type:       Dockerfile
Dockerfile path:  /convertly-hub/Dockerfile
Build context:    /convertly-hub
Target stage:     runner
```

Northflank за замовчуванням клонує repository, але build context обмежує
`COPY .` саме підпапкою `convertly-hub`. Тому Docker image не отримує
сусідні проєкти. Після першого build відкрийте logs: робочий directory і шляхи
`package.json`, `prisma` мають належати до `convertly-hub`, а не до батьківського
каталогу.

Runtime settings:

```text
Port:       3001 / HTTP / Public
Command:    оставить Dockerfile CMD
Health:     HTTP GET /api/health on port 3001
Instances:  1
```

Не додавайте Caddy: Northflank сам завершує TLS для public port і custom domain.
Не публікуйте PostgreSQL, Supabase S3 credentials або Gotenberg port.

### 5.2. Private Gotenberg service `convertly-gotenberg`

Створіть другий service з image `gotenberg/gotenberg:8`.

```text
Port:       3000 / HTTP / Private only
Public DNS: disabled
Health:     HTTP GET /health on port 3000
Instances:  1
```

В app secret group обов'язково вкажіть:

```dotenv
GOTENBERG_URL=http://convertly-gotenberg:3000
```

Формат `<service-name>:<private-port>` використовує Northflank internal DNS. Назва
має збігатися з фактичним service name із панелі. До запуску перевірте, що у
Gotenberg немає public domain/port: відкритий Gotenberg став би незахищеною точкою
конвертації для будь-якого відвідувача.

## 6. Секрети та configuration groups

Створіть дві **runtime secret groups**. Не прив'язуйте жодну до Gotenberg:

- `convertly-app-runtime` — лише до service `convertly-app`;
- `convertly-migration-runtime` — лише до migration/seed jobs.

| Змінна                                 | Звідки                       | Примітка                                                                                       |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `NODE_ENV`                             | вручну                       | `production`; потрібен обом groups                                                             |
| `HOSTNAME`, `PORT`                     | вручну                       | `0.0.0.0`, `3001`                                                                              |
| `NEXTAUTH_URL`                         | вручну                       | `https://convertly-hub.bon.kharkov.ua` лише після DNS/TLS; до цього generated Northflank URL   |
| `NEXTAUTH_SECRET`                      | новий random                 | відрізняється від локального                                                                    |
| `DATABASE_URL`                         | Supabase                     | server-only direct/pooler URI; ніколи не admin URI; потрібен обом groups                       |
| `MINIO_ENDPOINT`                       | Supabase Storage             | S3 endpoint, попри історичну назву variable                                                    |
| `S3_REGION`                            | Supabase                     | точне значення з project configuration                                                         |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | Supabase Storage             | S3 key pair, лише server-side                                                                   |
| `MINIO_BUCKET`                         | вручну                       | `convertly-files`                                                                              |
| `GOTENBERG_URL`                        | Northflank                   | `http://convertly-gotenberg:3000`                                                              |
| `SMTP_*`                               | uh.ua                        | production SMTP; MailHog не розгортається                                                      |
| `TELEGRAM_*`                           | BotFather / password manager | лише `convertly-app-runtime`; Bot API, deep link і webhook verification                        |

`convertly-migration-runtime` містить лише `NODE_ENV`, `DATABASE_URL` і під час
окремого призначення першого адміна тимчасовий `SEED_ADMIN_EMAIL`.
`convertly-app-runtime` отримує інші listed runtime values. Не додавайте
ці values до GitHub repository secrets для Northflank build і не
передавайте їх через Docker `ARG`: збірковий image/cache не має містити
runtime credentials. Northflank secret group і пов'язані provider dashboards —
єдині місця їх зберігання.

## 7. Міграції, перший адмін і порядок запуску

У Northflank створіть перший **one-off Job** `convertly-migrate` із тієї самої GitHub
гілки та з тими самими paths, але з Docker target `migration`:

```text
Dockerfile path:  /convertly-hub/Dockerfile
Build context:    /convertly-hub
Target stage:     migration
Command:           npx prisma migrate deploy
```

Job успадковує лише `DATABASE_URL` і `NODE_ENV=production` (не S3/SMTP/NextAuth
secrets). Запускайте його вручну після backup/перевірки connection string і до
першого app release. Не виконуйте Prisma migrations у `Dockerfile`, build step
або під час кожного старту app.

Порядок:

1. Створити Supabase project, private bucket і Northflank private Gotenberg.
2. Створити secret group, migration job та app service з generated Northflank URL.
3. Запустити migration job; він має завершитися з `0`.
4. Відкрити `https://<generated-app-domain>/api/health`: `database`, `storage` і
   `gotenberg` мають бути `up`.
5. Перевірити реєстрацію та SMTP-лист, вхід, reset password, guest flow,
   `JPG ↔ PNG`, `DOCX → PDF`, stored download, privacy mode і API key.
6. Зареєструвати та підтвердити перший email. Тимчасово додати лише цю
   адресу як `SEED_ADMIN_EMAIL` до **окремого** one-off job із command
   `node scripts/seed-first-admin.mjs`; після успішного призначення видалити
   змінну з job secrets.

Не запускайте seed разом із migrate: відсутність користувача має бути помилкою,
а не прихованим частковим deployment.

## 8. Domain, SMTP і Telegram

1. У Northflank додайте й підтвердьте root domain `bon.kharkov.ua`, потім
   прив'яжіть subdomain `convertly-hub.bon.kharkov.ua` лише до public port app.
2. В uh.ua внесіть **саме** DNS records, які попросить Northflank. Не змінюйте
   A/CNAME заздалегідь і не спрямовуйте туди Gotenberg/Supabase.
3. Після DNS propagation оновіть `NEXTAUTH_URL` на final HTTPS origin і
   перезапустіть app. Перевірте verification/reset посилання знову.
4. SMTP-скриньку вже створено, але до public demo підтвердьте її фактичні TLS settings,
   надсилання назовні та SPF/DKIM/DMARC. Не відкривайте MailHog в інтернеті.
5. Після успішного HTTPS domain заповніть `TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_BOT_USERNAME` і `TELEGRAM_WEBHOOK_SECRET` лише в
   `convertly-app-runtime`, потім налаштуйте Bot API webhook. Для поточного demo
   цей flow налаштований і вручну перевірений; повторюйте його під час перенесення бота або
   зміни provider. Команди, BotFather profile і manual smoke-test — у
   [telegram-bot-setup.md](./telegram-bot-setup.md).

## 9. Експлуатаційні обмеження demo

- Northflank/Supabase Free — не production SLA; стежте за usage та pause notices.
- Немає гарантованих off-host backup/restore і немає автоматичного cleanup
  expired conversion objects. Не зберігайте реальні чутливі дані.
- App має мати один instance: in-memory API/guest/auth limiters не спільні між
  репліками.
- `after(() => processConversionJob(...))` — MVP background mechanism. Не
  вмикайте autoscaling і не обіцяйте durable queue/retry semantics.
- За `503` health спочатку перевіряйте поле `database`, `storage` або `gotenberg`;
  не послаблюйте auth/owner checks заради «швидкого» demo fix.

## 10. Відкат і перехід до справжнього production

Для коду використовуйте rollback до попереднього green GitHub commit у Northflank.
Це не відновлює PostgreSQL або файли. Перед переходом на Oracle/Render Paid/
Vercel Pro експортуйте PostgreSQL і Storage objects, потім виконайте окремий
target runbook. Connection strings, `NEXTAUTH_SECRET`, SMTP і S3 keys у новому
контурі завжди створюються заново.

## 11. Офіційні джерела

- [Northflank Free tier и pricing](https://northflank.com/pricing)
- [Northflank Dockerfile build context](https://northflank.com/docs/v1/application/build/build-with-a-dockerfile)
- [Northflank private ports](https://northflank.com/docs/v1/application/network/configure-ports)
- [Northflank secret groups](https://northflank.com/docs/v1/application/secure/manage-secret-groups)
- [Supabase Free limits](https://supabase.com/pricing)
- [Supabase S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Supabase S3 server credentials](https://supabase.com/docs/guides/storage/s3/authentication)

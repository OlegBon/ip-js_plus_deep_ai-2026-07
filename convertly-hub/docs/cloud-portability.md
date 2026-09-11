# Переносимість хмарного розгортання

Цей runbook описує перенесення Convertly Hub між Northflank + Supabase,
Oracle Cloud, Render, Vercel і новим provider. Застосунок не прив'язано до
Supabase SDK: він використовує стандартний PostgreSQL connection string і
S3-compatible Storage. Тому перенесення реалістичне, але це контрольована
операція, а не проста зміна DNS.

## Що є джерелом істини

| Шар | Джерело та дія під час перенесення |
| --- | --- |
| Код і Prisma migrations | Git repository, папка `convertly-hub`; target Docker stages `runner` і `migration`. |
| PostgreSQL | Логічні `roles.sql`, `schema.sql`, `data.sql` із Supabase CLI; restore до нової БД. |
| Результати конвертацій | Private S3 bucket `convertly-files`; копіюються S3-to-S3 зі збереженням ключів. |
| Схема та версії | `prisma/migrations` із Git, потім `npx prisma migrate deploy` лише вперед. |
| Секрети | Не переносяться автоматично: створюються заново у secret manager нового provider. |
| Домен і TLS | DNS-записи та сертифікат налаштовуються у нового ingress/provider до cutover. |

Ніколи не копіюйте `.env`, password-manager exports, Supabase service key або
SMTP-пароль до Git. `NEXTAUTH_SECRET` потрібно зберегти незмінним під час міграції:
інакше чинні NextAuth JWT-сесії стануть невалідними. Це безпечно, але
користувачі будуть змушені увійти знову.

## Цільові варіанти

| Provider | App | PostgreSQL / storage | Gotenberg |
| --- | --- | --- | --- |
| Поточне demo: Northflank + Supabase | `convertly-app` service | Supabase PostgreSQL + Supabase S3 protocol | private Northflank service |
| Oracle Cloud Free Tier | Docker Compose на A1 ARM64 VM | PostgreSQL і MinIO на тій самій VM, зовнішні backup обов'язкові | private Compose service |
| Render | Web service | managed PostgreSQL + зовнішній S3 | окремий private worker/service |
| Vercel Pro | serverless Next.js, лише після перевірки runtime limits | managed PostgreSQL + зовнішній S3 | зовнішній завжди доступний Gotenberg service |
| Новий provider | Docker image із Git | PostgreSQL і S3-compatible storage | private HTTP service на port 3000 |

Деталі конкретних платформ залишаються в
[Northflank + Supabase](./northflank-supabase-setup.md),
[Oracle](./oracle-production-deployment.md),
[Render](./render-production-deployment.md) и
[Vercel](./vercel-production-deployment.md).

## Підготовка до cutover

1. Оберіть регіон, limits, egress, backup retention і доступність ARM64/x86
   образів. Не ухвалюйте рішення лише за «free» тарифом.
2. Створіть нові private PostgreSQL і private S3 bucket `convertly-files`.
   Запишіть endpoint, region і нові access keys до password manager.
3. Створіть private Gotenberg `gotenberg/gotenberg:8`, port `3000`, health
   check `GET /health`.
4. Підключіть Git repository і зберіть поточний `main` з build context
   `/convertly-hub`, Dockerfile `/convertly-hub/Dockerfile`, target `runner`.
   Створіть окремий manual migration workload із target `migration`.
5. Підготуйте нові runtime secrets:

   ```dotenv
   NODE_ENV=production
   APP_DOMAIN=<final-public-domain>
   NEXTAUTH_URL=https://<final-public-domain>
   NEXTAUTH_SECRET=<existing-value-or-new-value-with-forced-relogin>
   DATABASE_URL=<new-postgresql-url>
   MINIO_ENDPOINT=<new-s3-endpoint>
   S3_REGION=<provider-region>
   MINIO_ACCESS_KEY=<new-s3-access-key>
   MINIO_SECRET_KEY=<new-s3-secret-key>
   MINIO_BUCKET=convertly-files
   GOTENBERG_URL=<private-gotenberg-url>
   SMTP_HOST=<smtp-host>
   SMTP_PORT=<smtp-port>
   SMTP_SECURE=<true-or-false>
   SMTP_FROM="Convertly Hub <support@bon.kharkov.ua>"
   SMTP_USER=<smtp-user>
   SMTP_PASSWORD=<smtp-password>
   SUPPORT_EMAIL=support@bon.kharkov.ua
   ```

   У разі використання Telegram перенесіть також `TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` і після cutover оновіть
   webhook URL.
6. Не створюйте public domain для Gotenberg, Storage або migration job.

## Перенесення даних

1. Оберіть maintenance window і повідомте користувачів. Зупиніть нові
   записи: переведіть app service у maintenance/зупиніть ingress, але не
   видаляйте старий контур.
2. Створіть final SQL backup за
   [supabase-logical-backup.md](./supabase-logical-backup.md). Збережіть його
   поза межами Git.
3. Експортуйте/copy private S3 bucket. Ключі не можна перейменовувати:
   `ConversionLog.storageKey` містить точний шлях об'єкта. Зіставте кількість
   і загальний розмір об'єктів до та після copy.
4. Restore PostgreSQL спочатку до нової порожньої БД: roles → schema → data.
   Перевірте users, subscriptions, API key hashes, conversion logs і deletion
   audit trail лише read-only запитами.
5. Запустіть новий migration job із поточним Git commit. Він має завершитися
   `All migrations have been successfully applied.` Не використовуйте `db push`,
   `migrate reset` і не редагуйте застосовані migrations.
6. Розгорніть app без публічного traffic і перевірте `/api/health`: усі три
   стани мають бути `up`.

## Smoke-test до DNS

- вхід уже наявного користувача та перевірка збереження API key;
- `JPG ↔ PNG`, `DOCX → PDF`, збережена й незбережена конвертація;
- download старого та нового результату;
- email verification або password reset на зовнішню адресу;
- API flow із [api-powershell.md](./api-powershell.md);
- admin access і read-only review deletion requests;
- відсутність зовнішнього доступу до Gotenberg і S3.

## Cutover і rollback

1. Додайте DNS record, виданий новим provider, дочекайтеся TLS і лише тоді
   змініть `NEXTAUTH_URL`/`APP_DOMAIN` на final domain.
2. Перемкніть DNS із невеликим TTL, спостерігайте за `/api/health`, email та error
   logs. Не видаляйте старий app упродовж TTL і першого періоду спостереження.
3. Якщо застосунок не проходить smoke-test до публікації DNS, відкочуйте лише
   новий deployment і виправляйте конфігурацію; дані старого контуру не
   змінюйте.
4. Після DNS cutover rollback можливий поверненням DNS до старого робочого
   оточення, доки в новому не з'явилися розбіжні записи. Якщо вони з'явилися,
   спочатку оберіть одне джерело істини та сплануйте зворотну синхронізацію.

Rollback app image не відкочує PostgreSQL schema і не повертає файли з
bucket. Schema виправляється лише новою forward Prisma migration.

## Після перенесення

- перевірте backup на новому provider і виконайте тестовий restore;
- замініть/відкличте старі S3 keys та видаліть secrets старого provider лише
  після періоду спостереження;
- оновіть SMTP/Telegram provider settings за потреби;
- оновіть deployment runbook із фактичними provider, region і датою cutover.

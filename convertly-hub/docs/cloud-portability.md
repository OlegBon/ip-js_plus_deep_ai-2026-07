# Переносимость облачного развёртывания

Этот runbook описывает перенос Convertly Hub между Northflank + Supabase,
Oracle Cloud, Render, Vercel и новым provider. Приложение не привязано к
Supabase SDK: оно использует стандартный PostgreSQL connection string и
S3-compatible Storage. Поэтому перенос реалистичен, но это контролируемая
операция, а не простая смена DNS.

## Что является источником истины

| Слой | Источник и действие при переносе |
| --- | --- |
| Код и Prisma migrations | Git repository, папка `convertly-hub`; target Docker stages `runner` и `migration`. |
| PostgreSQL | Логические `roles.sql`, `schema.sql`, `data.sql` из Supabase CLI; restore в новую БД. |
| Результаты конвертаций | Private S3 bucket `convertly-files`; копируются S3-to-S3 с сохранением ключей. |
| Схема и версии | `prisma/migrations` из Git, затем `npx prisma migrate deploy` только вперёд. |
| Секреты | Не переносятся автоматически: заново создаются в secret manager нового provider. |
| Домен и TLS | DNS-записи и сертификат настраиваются у нового ingress/provider до cutover. |

Никогда не копируйте `.env`, password-manager exports, Supabase service key или
SMTP-пароль в Git. `NEXTAUTH_SECRET` нужно сохранить неизменным при миграции:
иначе действующие NextAuth JWT-сессии станут невалидными. Это безопасно, но
пользователи будут вынуждены войти снова.

## Целевые варианты

| Provider | App | PostgreSQL / storage | Gotenberg |
| --- | --- | --- | --- |
| Текущий demo: Northflank + Supabase | `convertly-app` service | Supabase PostgreSQL + Supabase S3 protocol | private Northflank service |
| Oracle Cloud Free Tier | Docker Compose на A1 ARM64 VM | PostgreSQL и MinIO на той же VM, внешние backup обязательны | private Compose service |
| Render | Web service | managed PostgreSQL + внешний S3 | отдельный private worker/service |
| Vercel Pro | serverless Next.js, только после проверки runtime limits | managed PostgreSQL + внешний S3 | внешний всегда доступный Gotenberg service |
| Новый provider | Docker image из Git | PostgreSQL и S3-compatible storage | private HTTP service на port 3000 |

Детали конкретных платформ остаются в
[Northflank + Supabase](./northflank-supabase-setup.md),
[Oracle](./oracle-production-deployment.md),
[Render](./render-production-deployment.md) и
[Vercel](./vercel-production-deployment.md).

## Подготовка до cutover

1. Выберите регион, limits, egress, backup retention и доступность ARM64/x86
   образов. Не принимайте решение только по «free» тарифу.
2. Создайте новую private PostgreSQL и private S3 bucket `convertly-files`.
   Запишите endpoint, region и новые access keys в password manager.
3. Создайте private Gotenberg `gotenberg/gotenberg:8`, port `3000`, health
   check `GET /health`.
4. Подключите Git repository и соберите текущий `main` с build context
   `/convertly-hub`, Dockerfile `/convertly-hub/Dockerfile`, target `runner`.
   Создайте отдельный manual migration workload с target `migration`.
5. Подготовьте новые runtime secrets:

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

   При использовании Telegram перенесите также `TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` и после cutover обновите
   webhook URL.
6. Не создавайте public domain для Gotenberg, Storage или migration job.

## Перенос данных

1. Выберите maintenance window и сообщите пользователям. Остановите новые
   записи: app service переведите в maintenance/остановите ingress, но не
   удаляйте старый контур.
2. Создайте final SQL backup по
   [supabase-logical-backup.md](./supabase-logical-backup.md). Сохраните его
   за пределами Git.
3. Экспортируйте/copy private S3 bucket. Ключи нельзя переименовывать:
   `ConversionLog.storageKey` содержит точный путь объекта. Сверьте количество
   и общий размер объектов до и после copy.
4. Restore PostgreSQL сначала в новую пустую БД: roles → schema → data.
   Проверьте users, subscriptions, API key hashes, conversion logs и deletion
   audit trail только read-only запросами.
5. Запустите новый migration job с текущим Git commit. Он должен завершиться
   `All migrations have been successfully applied.` Не используйте `db push`,
   `migrate reset` и не редактируйте применённые migrations.
6. Разверните app без публичного traffic и проверьте `/api/health`: все три
   состояния должны быть `up`.

## Smoke-test до DNS

- вход уже существующего пользователя и проверка сохранности API key;
- `JPG ↔ PNG`, `DOCX → PDF`, сохранённая и несохранённая конвертация;
- download старого результата и нового результата;
- email verification или password reset на внешний адрес;
- API flow из [api-powershell.md](./api-powershell.md);
- admin access и read-only review deletion requests;
- отсутствие внешнего доступа к Gotenberg и S3.

## Cutover и rollback

1. Добавьте DNS record, выданный новым provider, дождитесь TLS и только затем
   измените `NEXTAUTH_URL`/`APP_DOMAIN` на final domain.
2. Переключите DNS с небольшим TTL, наблюдайте `/api/health`, email и error
   logs. Старый app не удаляйте во время TTL и первого периода наблюдения.
3. Если приложение не проходит smoke-test до публикации DNS, откатите только
   новый deployment и исправьте конфигурацию; данные старого контура не
   изменяйте.
4. После DNS cutover rollback возможен возвратом DNS к старому работающему
   окружению, пока в новом не появились расходящиеся записи. Если появились,
   сначала выберите один источник истины и спланируйте обратную синхронизацию.

Rollback app image не откатывает PostgreSQL schema и не возвращает файлы из
bucket. Schema исправляется только новой forward Prisma migration.

## После переноса

- проверьте backup на новом provider и выполните тестовый restore;
- замените/отзовите старые S3 keys и удалите secrets старого provider только
  после периода наблюдения;
- обновите SMTP/Telegram provider settings при необходимости;
- обновите deployment runbook с фактическим provider, region и датой cutover.

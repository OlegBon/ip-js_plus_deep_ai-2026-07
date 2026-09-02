# Vercel Pro: production runbook-план

Этот документ — план выбора и безопасного развёртывания, а **не** инструкция для
немедленного запуска. На 2 сентября 2026 в репозитории нет Vercel-конфигурации,
Vercel-аккаунт не изменяется и production-секреты не создаются.

Vercel Pro подходит для Next.js-приложения, но не заменяет текущий единый Docker
server: PostgreSQL, S3-хранилище и Gotenberg должны быть отдельными managed
сервисами. Для коммерческого публичного проекта выбирается Pro, а не Hobby.
Актуальные условия и цена проверяются в [Vercel Pricing](https://vercel.com/pricing)
непосредственно перед заказом.

## 1. Целевая схема

```text
Browser
  └─ Vercel Pro: Next.js / Route Handlers
       ├─ Managed PostgreSQL
       ├─ S3-compatible private object storage
       ├─ SMTP provider
       └─ authenticated conversion worker (Gotenberg)
```

- **PostgreSQL:** выбирается managed PostgreSQL с поддержкой подключения Prisma в
  serverless-среде и connection pooling. До выбора сверяются регион, backup,
  лимит соединений, стоимость и процедура восстановления.
- **Object storage:** private S3-compatible bucket. MinIO из локального Compose
  здесь не запускается; провайдер выбирается отдельно (например, R2/S3) после
  проверки совместимости endpoint, региона, credentials и lifecycle rules.
- **Gotenberg:** выделенный worker, недоступный анонимно из интернета. Нельзя
  публиковать стандартный Gotenberg endpoint без дополнительной аутентификации.
  Нужны private networking либо отдельный auth-прокси/подписанный service-to-service
  запрос и затем изменение приложения с тестами.
- **SMTP:** реальный SMTP ящика `support@bon.kharkov.ua` после проверки host,
  TLS, порта, SPF, DKIM и DMARC. MailHog на Vercel не используется.

## 2. Что нужно решить до настройки Vercel

1. Подтвердить бюджет: Vercel Pro и каждый внешний production-сервис оплачиваются
   отдельно; текущие цены и included usage не фиксируются в этом документе.
2. Выбрать один регион, близкий к пользователям, и подтвердить, что PostgreSQL,
   bucket и worker находятся в совместимых регионах.
3. Выбрать конкретные PostgreSQL, S3 и worker providers. Зафиксировать их в
   отдельном решении, включая SLA, quotas, backups, data residency и egress.
4. Спроектировать закрытый доступ Vercel → worker. Публичный URL worker допустим
   только после реализации аутентификации на уровне gateway/worker и проверки
   отказа неавторизованных запросов.
5. Проверить лимиты Vercel на request body, execution duration и memory для
   максимального размера файла каждого тарифа. При несоответствии нужен direct
   upload в storage и отдельный job/worker flow — это отдельная архитектурная
   задача, не настройка environment variables.
6. Согласовать production-domain `convertly-hub.bon.kharkov.ua` и сохранить
   возможность быстро вернуть DNS на предыдущий работающий контур.

## 3. Практический порядок отдельной deployment-задачи

### 3.1. Подготовка сервисов

1. Создать managed PostgreSQL и private bucket, включить backup/lifecycle и
   выполнить тестовое восстановление вне production.
2. Развернуть закрытый Gotenberg worker и реализовать проверяемый механизм его
   аутентификации. Добавить unit/integration/E2E-тесты для service-to-service
   доступа и отказа внешнему клиенту.
3. Создать production SMTP credentials в панели почтового провайдера; значения не
   копируются в документацию, GitHub Actions logs или клиентский `NEXT_PUBLIC_*`.

### 3.2. Настройка Vercel

1. Импортировать **папку `convertly-hub` как Root Directory** монорепозитория.
   Не деплоить родительскую папку с другими учебными проектами.
2. Создать отдельные Vercel environments: Preview и Production. Секреты каждой
   среды различны; Preview не должен обращаться к production database/bucket.
3. Добавить server-only variables: `DATABASE_URL`, `NEXTAUTH_URL`,
   `NEXTAUTH_SECRET`, SMTP-настройки, S3-настройки и URL/credentials worker.
   Сверить имена с `.env.production.example`; не создавать `NEXT_PUBLIC_` копии
   секретов.
4. Настроить `convertly-hub.bon.kharkov.ua` в Vercel и только затем изменить
   DNS-записи у uh.ua согласно выданной Vercel инструкции. После propagation
   проверить HTTPS и redirect policy.
5. Миграции не запускаются в каждом serverless deploy. Применить
   `npx prisma migrate deploy` отдельным контролируемым job/CI step с
   production connection string, после backup и до переключения трафика.
6. После подтверждения первого email запустить `npm run admin:seed-first` из
   безопасной администраторской среды с production `DATABASE_URL`, не из browser
   и не из публичного Route Handler.

### 3.3. Smoke-test и откат

Проверить `GET /api/health`, регистрацию, verification email, login, reset password,
guest quota, все три доступных направления конвертации, privacy mode, Dashboard,
API key и admin access. Полный набор CI должен быть зелёным до release.

Откат Vercel deployment не заменяет восстановление данных. Для проблем кода
вернуть предыдущий deployment; для миграций и данных использовать заранее
проверенные backup/restore runbook выбранных providers.

## 4. Границы и критерий готовности

Нельзя объявлять этот вариант production-ready, пока не выполнены все пункты:

- выбран и протестирован закрытый conversion worker;
- подтверждена совместимость file-size/timeouts с Vercel;
- раздельные секреты и базы Preview/Production созданы безопасно;
- протестированы backup и restore PostgreSQL/bucket;
- DNS, SMTP, HTTPS и все production smoke-tests успешны.

Пока эти условия не выполнены, продолжайте использовать локальную среду или
Oracle runbook. Этот план не изменяет существующий Oracle deployment-контур.

## 5. Официальные источники для следующей задачи

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel: environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: monorepos](https://vercel.com/docs/monorepos)
- [Vercel: custom domains](https://vercel.com/docs/domains)
- [Prisma: deploying to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)

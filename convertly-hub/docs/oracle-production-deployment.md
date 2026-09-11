# Production-розгортання на Oracle Cloud Free Tier

Цей runbook призначено для окремої ARM64 VM Oracle A1 у Frankfurt і домену
`convertly-hub.bon.kharkov.ua`. Він **не переносить** локальні дані: перший
production-запуск створює чисті PostgreSQL і MinIO volumes на сервері.

Локальна розробка лишається в [local-start.md](./local-start.md). Не змішуйте
`docker-compose.yml` і production-файл, а також `.env` і `.env.production`.

## 1. Склад production-стеку

`docker-compose.production.yml` піднімає на одному сервері:

```text
Internet
  └─ Caddy :80/:443 (HTTPS)
       └─ Next.js :3001 (внутрішня Docker-мережа)
            ├─ PostgreSQL :5432 (внутрішня мережа)
            ├─ MinIO :9000 (внутрішня мережа)
            └─ Gotenberg :3000 (внутрішня мережа)
```

MailHog не запускається у виробничому середовищі: листи надсилаються через SMTP-провайдера. БД, MinIO, Gotenberg, порт Next.js та MinIO Console не публікуються на хості.

Next.js збирається у standalone-образі. Міграції та створення першого адміністратора
виконуються окремим одноразовим сервісом `migrate`, щоб застосунок не змінював
схему бази непомітно під час кожного старту.

## 2. До создания VM

1. В Oracle Console для **Germany Central (Frankfurt)** створіть окремий Always
   Free instance з образом Ubuntu 24.04 LTS (aarch64) і shape `VM.Standard.A1.Flex`.
   На момент підготовки доступні 2 A1 OCPU; для MVP виберіть **2 OCPU і 12 GB RAM**,
   якщо консоль дає вибрати цей обсяг. Не розміщуйте Convertly Hub на VM з n8n.
2. Виберіть boot volume 100 GB (у межах Free Tier), увімкніть регулярні Oracle
   backups boot volume і вхід за SSH-ключем. Збережіть private key локально, не в
   репозиторії й не в `.env`.
3. Призначте зарезервований public IPv4. В uh.ua додайте A-запис
   `convertly-hub.bon.kharkov.ua` на цей IP з TTL 300. Робіть це після отримання
   IP, але до запуску Caddy: для автоматичного TLS домен уже має резолвитися.
4. В Security List/Network Security Group разрешите только:
   - TCP `22` — лише з вашої поточної публічної IP-адреси;
   - TCP `80` и `443` — з Інтернету.

   Не відкривайте `3001`, `5432`, `9000`, `9001`, `1025`, `8025` або `3000`.
   Повторіть ті самі правила в UFW на самій VM.

## 3. ARM64 preflight

Docker-образи PostgreSQL 15, MinIO і Gotenberg 8 мають ARM64-варіанти; точна
перевірка однаково виконується на створеній A1 VM, оскільки registry-теги можуть
змінитися.

Після встановлення Docker Engine і Compose plugin виконайте:

```bash
docker pull postgres:15-alpine
docker pull minio/minio
docker pull minio/mc
docker pull gotenberg/gotenberg:8
docker pull caddy:2-alpine

docker image inspect postgres:15-alpine --format '{{.Architecture}}'
docker image inspect minio/minio --format '{{.Architecture}}'
docker image inspect gotenberg/gotenberg:8 --format '{{.Architecture}}'
```

Кожна команда `inspect` має вивести `arm64`. Потім production Compose виконає
локальну збірку Node/Next.js саме на A1, тому нативні `sharp`, `bcrypt` і
Prisma engine відповідатимуть ARM64.

## 4. Підготовка сервера

Підключіться через SSH і встановіть Docker лише з офіційної інструкції Docker для
Ubuntu, зокрема `docker-compose-plugin`. Після встановлення увійдіть повторно, щоб
користувач увійшов до групи `docker`.

```bash
git clone <URL-вашого репозиторію> convertly-hub
cd convertly-hub
git switch main
git pull --ff-only

cp .env.production.example .env.production
chmod 600 .env.production
```

Заповніть `.env.production`, не додаючи його до Git:

- `APP_DOMAIN=convertly-hub.bon.kharkov.ua`;
- `NEXTAUTH_URL=https://convertly-hub.bon.kharkov.ua`;
- новий `NEXTAUTH_SECRET`, наприклад `openssl rand -base64 48`;
- унікальні узгоджені `POSTGRES_PASSWORD` і пароль у `DATABASE_URL`;
- унікальні `MINIO_ACCESS_KEY` і `MINIO_SECRET_KEY`;
- реальний SMTP пароль для `support@bon.kharkov.ua`.

Для скриньки uh.ua спершу перевірте в панелі провайдера точні SMTP host, TLS-режим і
порт. Типовий варіант — `mail.bon.kharkov.ua`, `465`, `SMTP_SECURE=true`. Не
використовуйте вихідний порт 25: Oracle зазвичай обмежує його. До публічного запуску
налаштуйте у провайдера SPF, DKIM і DMARC для `bon.kharkov.ua`.

Переконайтеся, що `DATABASE_URL` використовує hostname `db`, а `MINIO_ENDPOINT` —
`http://minio:9000`: це внутрішні імена Docker, не публічний домен.
Для локального MinIO на Oracle залиште `S3_REGION=us-east-1`; ця server-only
змінна потрібна лише для переходу на інший S3-compatible provider.

## 5. Перший запуск

В усіх командах нижче `--env-file .env.production` є обов'язковим: він підставляє
змінні у Compose-файл. Кожному контейнеру передаються лише потрібні йому
змінні, тому SMTP і session-секрет не потрапляють до Caddy, PostgreSQL або MinIO.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config
docker compose --env-file .env.production -f docker-compose.production.yml build --pull

docker compose --env-file .env.production -f docker-compose.production.yml up -d db minio gotenberg
docker compose --env-file .env.production -f docker-compose.production.yml run --rm minio-init
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d app caddy
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

Очікуваний стан: `db`, `minio`, `gotenberg`, `app`, `caddy` — `running`; `app`
стає `healthy`. Для `minio-init` і `migrate` нормальним є одноразовий вихід з
кодом `0`.

## 6. Перевірка після запуску

```bash
curl -fsS https://convertly-hub.bon.kharkov.ua/api/health
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 app caddy
```

Health endpoint має повернути `status: healthy` і `database`, `storage`,
`gotenberg` зі значенням `up`. Потім вручну перевірте:

1. реєстрацію і доставку verification-листа на реальну адресу;
2. вхід, reset password і перехід за посиланнями з email;
3. `JPG → PNG`, `PNG → JPG` і `DOCX → PDF`;
4. збереження результату та захищене завантаження з Dashboard;
5. гостьову місячну квоту;
6. API-конвертацію тестовим API-ключем (якщо тариф дозволяє ключі).

Лише після реєстрації та підтвердження адреси першого користувача додайте його
email до `SEED_ADMIN_EMAIL` і виконайте:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate node scripts/seed-first-admin.mjs
```

Скрипт навмисно відмовиться призначати другого першого адміністратора. Подальші
зміни ролей виконуються через Admin Panel.

## 7. Оновлення застосунку

Перед оновленням локально переконайтеся, що GitHub Actions для потрібного commit успішний.
На сервері:

```bash
git pull --ff-only
docker compose --env-file .env.production -f docker-compose.production.yml build --pull
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d app caddy
curl -fsS https://convertly-hub.bon.kharkov.ua/api/health
```

Не використовуйте `npm audit fix --force` на сервері. Зміни залежностей проходять
окрему гілку, локальні перевірки та GitHub Actions до deployment.

## 8. Backup, monitoring і межі MVP

Дані зберігаються у named volumes `postgres_data`, `minio_data`, `caddy_data` і
`caddy_config`. До появи першого файлу користувача створіть окрему задачу для
автоматичного щоденного `pg_dump` і дзеркалювання MinIO bucket у зовнішнє
сховище (наприклад, OCI Object Storage). Копія лише на тій самій VM не є
backup. Перевірте процедуру відновлення на окремій машині.

Для MVP використовуйте `GET /api/health`, `docker compose ps` і логи Caddy/app.
Постійний зовнішній моніторинг, alerting, централізовані логи, Redis limiter і
повна адмінська історія failed conversions залишаються наступними production-задачами.

## 9. Відкат та аварійна діагностика

Якщо новий commit не проходить health-check, зупиніть лише застосунок і Caddy,
поверніть попередній перевірений Git commit, перезберіть image і застосуйте його за
кроками розділу 7. Не видаляйте `postgres_data` або `minio_data` для відкату коду.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=200 app caddy db minio gotenberg
```

`docker compose down -v` видаляє production-дані й у цій інструкції заборонений.

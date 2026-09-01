# Production-развёртывание на Oracle Cloud Free Tier

Этот runbook предназначен для отдельной ARM64 VM Oracle A1 в Frankfurt и домена
`convertly-hub.bon.kharkov.ua`. Он **не переносит** локальные данные: первый
production-запуск создаёт чистые PostgreSQL и MinIO volumes на сервере.

Локальная разработка остаётся в [local-start.md](./local-start.md). Не смешивайте
`docker-compose.yml` и production-файл, а также `.env` и `.env.production`.

## 1. Состав production-стека

`docker-compose.production.yml` поднимает на одном сервере:

```text
Internet
  └─ Caddy :80/:443 (HTTPS)
       └─ Next.js :3001 (внутренняя Docker-сеть)
            ├─ PostgreSQL :5432 (внутренняя сеть)
            ├─ MinIO :9000 (внутренняя сеть)
            └─ Gotenberg :3000 (внутренняя сеть)
```

MailHog в production не запускается: письма идут через SMTP-провайдера. БД, MinIO,
Gotenberg, порт Next.js и MinIO Console не публикуются на хост.

Next.js собирается в standalone-образе. Миграции и создание первого администратора
выполняются отдельным одноразовым сервисом `migrate`, чтобы приложение не меняло
схему базы при каждом старте незаметно.

## 2. До создания VM

1. В Oracle Console для **Germany Central (Frankfurt)** создайте отдельный Always
   Free instance с образом Ubuntu 24.04 LTS (aarch64) и shape `VM.Standard.A1.Flex`.
   На момент подготовки доступны 2 A1 OCPU; для MVP выберите **2 OCPU и 12 GB RAM**,
   если консоль даёт выбрать этот объём. Не размещайте Convertly Hub на VM с n8n.
2. Выберите boot volume 100 GB (в пределах Free Tier), включите регулярные Oracle
   backups boot volume и вход по SSH-ключу. Сохраните private key локально, не в
   репозитории и не в `.env`.
3. Назначьте зарезервированный public IPv4. В uh.ua добавьте A-запись
   `convertly-hub.bon.kharkov.ua` на этот IP с TTL 300. Делайте это после получения
   IP, но до запуска Caddy: для автоматического TLS домен должен уже резолвиться.
4. В Security List/Network Security Group разрешите только:
   - TCP `22` — только с вашего текущего публичного IP;
   - TCP `80` и `443` — из интернета.

   Не открывайте `3001`, `5432`, `9000`, `9001`, `1025`, `8025` или `3000`.
   Повторите те же правила в UFW на самой VM.

## 3. ARM64 preflight

Docker-образы PostgreSQL 15, MinIO и Gotenberg 8 имеют ARM64-варианты; точная
проверка всё равно выполняется на созданной A1 VM, потому что registry-теги могут
измениться.

После установки Docker Engine и Compose plugin выполните:

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

Каждая команда `inspect` должна вывести `arm64`. Затем production Compose выполнит
локальную сборку Node/Next.js именно на A1, поэтому нативные `sharp`, `bcrypt` и
Prisma engine будут соответствовать ARM64.

## 4. Подготовка сервера

Подключитесь по SSH и установите Docker только из официальной инструкции Docker для
Ubuntu, включая `docker-compose-plugin`. После установки войдите заново, чтобы
пользователь вошёл в группу `docker`.

```bash
git clone <URL-вашего-репозитория> convertly-hub
cd convertly-hub
git switch main
git pull --ff-only

cp .env.production.example .env.production
chmod 600 .env.production
```

Заполните `.env.production`, не добавляя его в Git:

- `APP_DOMAIN=convertly-hub.bon.kharkov.ua`;
- `NEXTAUTH_URL=https://convertly-hub.bon.kharkov.ua`;
- новый `NEXTAUTH_SECRET`, например `openssl rand -base64 48`;
- уникальные согласованные `POSTGRES_PASSWORD` и пароль в `DATABASE_URL`;
- уникальные `MINIO_ACCESS_KEY` и `MINIO_SECRET_KEY`;
- реальный SMTP пароль для `support@bon.kharkov.ua`.

Для ящика uh.ua сначала проверьте в панели провайдера точные SMTP host, TLS-режим и
порт. Типичный вариант — `mail.bon.kharkov.ua`, `465`, `SMTP_SECURE=true`. Не
используйте исходящий порт 25: Oracle обычно ограничивает его. До публичного запуска
настройте у провайдера SPF, DKIM и DMARC для `bon.kharkov.ua`.

Убедитесь, что `DATABASE_URL` использует hostname `db`, а `MINIO_ENDPOINT` —
`http://minio:9000`: это внутренние имена Docker, не публичный домен.

## 5. Первый запуск

Во всех командах ниже `--env-file .env.production` обязателен: он подставляет
переменные в Compose-файл. Каждому контейнеру передаются только необходимые ему
переменные, поэтому SMTP и session-секрет не попадают в Caddy, PostgreSQL или MinIO.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config
docker compose --env-file .env.production -f docker-compose.production.yml build --pull

docker compose --env-file .env.production -f docker-compose.production.yml up -d db minio gotenberg
docker compose --env-file .env.production -f docker-compose.production.yml run --rm minio-init
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d app caddy
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

Ожидаемое состояние: `db`, `minio`, `gotenberg`, `app`, `caddy` — `running`; `app`
становится `healthy`. У `minio-init` и `migrate` нормальный одноразовый выход с
кодом `0`.

## 6. Проверка после запуска

```bash
curl -fsS https://convertly-hub.bon.kharkov.ua/api/health
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 app caddy
```

Health endpoint должен вернуть `status: healthy` и `database`, `storage`,
`gotenberg` со значением `up`. Затем вручную проверьте:

1. регистрацию и доставку verification-письма на реальный адрес;
2. вход, reset password и переход по ссылкам из email;
3. `JPG → PNG`, `PNG → JPG` и `DOCX → PDF`;
4. сохранение результата и защищённое скачивание из Dashboard;
5. гостевую месячную квоту;
6. API-конвертацию тестовым API-ключом (если тариф разрешает ключи).

Только после регистрации и подтверждения адреса первого пользователя добавьте его
email в `SEED_ADMIN_EMAIL` и выполните:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate node scripts/seed-first-admin.mjs
```

Скрипт намеренно откажется назначать второго первого администратора. Последующие
изменения ролей выполняются через Admin Panel.

## 7. Обновление приложения

Перед обновлением локально убедитесь, что GitHub Actions для нужного commit зелёный.
На сервере:

```bash
git pull --ff-only
docker compose --env-file .env.production -f docker-compose.production.yml build --pull
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d app caddy
curl -fsS https://convertly-hub.bon.kharkov.ua/api/health
```

Не используйте `npm audit fix --force` на сервере. Изменения зависимостей проходят
отдельную ветку, локальные проверки и GitHub Actions до deployment.

## 8. Backup, monitoring и границы MVP

Данные хранятся в named volumes `postgres_data`, `minio_data`, `caddy_data` и
`caddy_config`. Создайте до первого пользовательского файла отдельную задачу для
автоматического ежедневного `pg_dump` и зеркалирования MinIO bucket во внешнее
хранилище (например, OCI Object Storage). Копия только на той же VM не является
backup. Проверьте процедуру восстановления на отдельной машине.

Для MVP используйте `GET /api/health`, `docker compose ps` и логи Caddy/app.
Постоянный внешний мониторинг, alerting, централизованные логи, Redis limiter и
полная админская история failed conversions остаются следующими production-задачами.

## 9. Откат и аварийная диагностика

Если новый commit не проходит health-check, остановите только приложение и Caddy,
верните предыдущий проверенный Git commit, пересоберите image и примените его по
шагам раздела 7. Не удаляйте `postgres_data` или `minio_data` для отката кода.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=200 app caddy db minio gotenberg
```

`docker compose down -v` удаляет production-данные и в этой инструкции запрещён.

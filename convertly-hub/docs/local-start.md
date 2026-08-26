# Локальный старт Convertly Hub

Это каноническая инструкция для запуска локального MVP: от чистого клона до первого администратора. Старый [START.md](./START.md) оставлен как техническая справка; для повседневного старта используйте этот документ.

## 1. Что нужно заранее

- Node.js LTS и npm;
- Docker Desktop с включённым Linux engine;
- свободные порты `3000`, `3001`, `5432`, `9000`, `9001`, `1025` и `8025`;
- репозиторий с установленными зависимостями: `npm install`.

В PowerShell проверьте инструменты и Docker:

```powershell
node --version
npm --version
docker version
docker compose version
```

Если `docker version` не показывает раздел `Server`, запустите Docker Desktop и дождитесь статуса *Engine running*. Не продолжайте к миграциям, пока Docker недоступен.

## 2. Настройка `.env`

1. Если `.env` ещё нет, создайте приватный файл из шаблона:

```powershell
Copy-Item .env.example .env
```

2. Если `.env` уже существует, **не перезаписывайте его**. Сверьте его с `.env.example` и добавьте отсутствующий локальный блок:

```dotenv
# Document conversion worker
GOTENBERG_URL=http://localhost:3000

# Local MailHog for password reset and email verification
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="Convertly Hub <no-reply@convertly.local>"
SMTP_SECURE=false
```

Эти пять значений нужны соответственно для `DOCX → PDF` и для локальной доставки reset/verification-писем в MailHog. Они не заменяют существующие секреты и не требуют production SMTP-учётных данных.

3. Замените в `.env` все значения-заглушки для `NEXTAUTH_SECRET`, паролей PostgreSQL и MinIO. Секрет сессии удобно сгенерировать так:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

4. Не добавляйте `.env` в Git. Он уже игнорируется; в репозиторий попадает только `.env.example` без реальных секретов.

### Один публичный адрес

`NEXTAUTH_URL` — единственный публичный origin приложения. Он используется NextAuth и ссылками для reset/verification email. При смене `localhost` на домен измените только его, например:

```dotenv
NEXTAUTH_URL=https://convertly.example
```

`APP_DOMAIN` и `APP_URL` не нужны и не используются. Адреса `localhost` в `DATABASE_URL`, `MINIO_ENDPOINT`, `GOTENBERG_URL` и SMTP-настройках — это внутренние локальные сервисы Docker. Они не меняются при смене публичного домена; в production их заменяют адресами соответствующих managed-сервисов.

## 3. Первый запуск

Docker Desktop и Docker Compose — разные состояния: запущенный Docker Desktop означает, что доступен Docker Engine, но контейнеры Convertly Hub ещё могут быть остановлены. Для полного локального запуска (БД, S3, DOCX → PDF и MailHog) обязательно выполните `docker compose up -d` и убедитесь, что все четыре сервиса имеют статус `running`.

Из корня `convertly-hub` выполните:

```powershell
docker compose up -d
docker compose ps
npx prisma migrate deploy
npx prisma generate
npx next dev -p 3001
```

Ожидаемые сервисы в `docker compose ps`: `db`, `minio`, `gotenberg` и `mailhog`. Без них приложение может открыть часть UI, но миграции, health-check, хранилище, `DOCX → PDF` или email-сценарии будут недоступны.

Оставьте последний процесс запущенным и откройте `http://localhost:3001`. В некоторых оболочках рабочей альтернативой также будет:

```powershell
npm run dev -- --port 3001
```

`migrate deploy` применяет только отслеживаемые миграции и подходит для нового/существующего локального окружения. Для изменения Prisma-схемы разработчик создаёт отдельную миграцию через `npx prisma migrate dev --name <name>`; не используйте `migrate reset` для рабочей базы с данными.

## 4. Проверка после старта

### Инфраструктура

```powershell
docker compose exec -T db pg_isready
npx prisma migrate status
```

В браузере или через HTTP должны быть доступны:

- MinIO liveness: `http://localhost:9000/minio/health/live` — в браузере допустима пустая страница: признак готовности — HTTP `200`. Альтернативный endpoint на `http://localhost:9001/minio/health/live` также возвращает `200`;
- MinIO Console: `http://localhost:9001` — входной экран `http://localhost:9001/login` является ожидаемым поведением;
- Gotenberg: `http://localhost:3000/health` — `up` для Chromium и LibreOffice;
- MailHog inbox: `http://localhost:8025`.

### Приложение и API

1. Откройте `http://localhost:3001` и убедитесь, что видны guest-конвертация, вход и регистрация.
2. Откройте `http://localhost:3001/api/health`. Полностью здоровый ответ имеет HTTP `200`:

```json
{
  "status": "healthy",
  "database": "up",
  "storage": "up",
  "gotenberg": "up"
}
```
3. Выполните единый локальный HTTP-аудит:

```powershell
npm run audit:api
```

Он сохраняет актуальный отчёт в `docs/audits/api-audit-latest.md` и проверяет инфраструктуру, health API, NextAuth session и неавторизованные границы account/admin API.

4. Зарегистрируйте пользователя: приложение автоматически отправит одноразовое verification-письмо в MailHog. Откройте новую ссылку на `http://localhost:3001/...`; Dashboard остаётся безопасным способом повторной отправки. Затем войдите и проверьте browser-конвертацию `JPG ↔ PNG` либо `DOCX → PDF`.

## 5. Первый администратор

1. Сначала зарегистрируйте обычного пользователя через UI.
2. Впишите его email в локальный `.env` как `SEED_ADMIN_EMAIL`.
3. Однократно выполните:

```powershell
npm run admin:seed-first
```

Скрипт не принимает пароль, назначает `ADMIN` только зарегистрированному пользователю, записывает audit-событие и прекращает работу, если администратор уже есть. После этого войдите заново и откройте `/management`.

## 6. Необязательная Telegram-привязка

Локальный UI и другие функции не требуют Telegram. Настраивайте `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` и `TELEGRAM_WEBHOOK_SECRET` только после появления публичного HTTPS-домена: Telegram webhook не может обращаться к `localhost`. Затем направьте webhook на `POST /api/telegram/webhook` с тем же secret token.

## 7. Остановка и диагностика

```powershell
# Остановить Next.js: Ctrl+C в его терминале
docker compose down
```

`docker compose down` останавливает контейнеры, но сохраняет Docker volumes с PostgreSQL и MinIO. Не удаляйте volumes, если хотите сохранить локальные данные.

| Симптом | Что проверить |
| --- | --- |
| Docker daemon недоступен | Запустить Docker Desktop; затем повторить `docker version` и `docker compose up -d`. |
| Порт занят | Найти процесс, освободить порт либо запустить Next.js на свободном порту и соответственно поменять только локальный `NEXTAUTH_URL`. |
| Prisma не подключается | `docker compose ps`, совпадение `POSTGRES_*` и `DATABASE_URL` в `.env`, затем `npx prisma migrate status`. |
| `/api/health` возвращает `503` | Проверить поля JSON: `database`, `storage`, `gotenberg`; затем соответствующий контейнер и адрес в `.env`. |
| Письмо не пришло | Убедиться, что MailHog запущен и открыть `http://localhost:8025`; локальные SMTP-значения оставьте из `.env.example`. |

## 8. Полезные команды

```powershell
npm run linteslint
npx jest --runInBand
npm run build
npm run audit:api
npx prisma studio
```

Подробная карта маршрутов находится в [architecture.md](./architecture.md#5-api-endpoints), а границы будущих реальных integration/E2E-проверок — в [e2e_test_plan.md](./e2e_test_plan.md).

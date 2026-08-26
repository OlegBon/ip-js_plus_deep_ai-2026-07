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

1. Создайте приватный файл из шаблона:

```powershell
Copy-Item .env.example .env
```

2. Замените в `.env` все значения-заглушки для `NEXTAUTH_SECRET`, паролей PostgreSQL и MinIO. Секрет сессии удобно сгенерировать так:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

3. Не добавляйте `.env` в Git. Он уже игнорируется; в репозиторий попадает только `.env.example` без реальных секретов.

### Один публичный адрес

`NEXTAUTH_URL` — единственный публичный origin приложения. Он используется NextAuth и ссылками для reset/verification email. При смене `localhost` на домен измените только его, например:

```dotenv
NEXTAUTH_URL=https://convertly.example
```

`APP_DOMAIN` и `APP_URL` не нужны и не используются. Адреса `localhost` в `DATABASE_URL`, `MINIO_ENDPOINT`, `GOTENBERG_URL` и SMTP-настройках — это внутренние локальные сервисы Docker. Они не меняются при смене публичного домена; в production их заменяют адресами соответствующих managed-сервисов.

## 3. Первый запуск

Из корня `convertly-hub` выполните:

```powershell
docker compose up -d
docker compose ps
npx prisma migrate deploy
npx prisma generate
npm run dev -- --port 3001
```

Оставьте последний процесс запущенным и откройте `http://localhost:3001`. Если npm в текущей оболочке передаёт аргумент `--port` как npm-config, используйте эквивалентную команду:

```powershell
npx next dev -p 3001
```

`migrate deploy` применяет только отслеживаемые миграции и подходит для нового/существующего локального окружения. Для изменения Prisma-схемы разработчик создаёт отдельную миграцию через `npx prisma migrate dev --name <name>`; не используйте `migrate reset` для рабочей базы с данными.

## 4. Проверка после старта

### Инфраструктура

```powershell
docker compose exec -T db pg_isready
npx prisma migrate status
```

В браузере или через HTTP должны быть доступны:

- MinIO liveness: `http://localhost:9000/minio/health/live`;
- MinIO Console: `http://localhost:9001`;
- Gotenberg: `http://localhost:3000/health` — `up` для Chromium и LibreOffice;
- MailHog inbox: `http://localhost:8025`.

### Приложение и API

1. Откройте `http://localhost:3001` и убедитесь, что видны guest-конвертация, вход и регистрация.
2. Откройте `http://localhost:3001/api/health`. Полностью здоровый ответ имеет HTTP `200` и поля `database`, `storage`, `gotenberg` со значением `up`.
3. Выполните единый локальный HTTP-аудит:

```powershell
npm run audit:api
```

Он сохраняет актуальный отчёт в `docs/audits/api-audit-latest.md` и проверяет инфраструктуру, health API, NextAuth session и неавторизованные границы account/admin API.

4. Зарегистрируйте пользователя, войдите и проверьте browser-конвертацию `JPG ↔ PNG` либо `DOCX → PDF`. Для теста reset/email verification запросите письмо и откройте его в MailHog.

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

Подробная карта маршрутов находится в [architecture.md](./docs/architecture.md#5-api-endpoints), а границы будущих реальных integration/E2E-проверок — в [e2e_test_plan.md](./docs/e2e_test_plan.md).

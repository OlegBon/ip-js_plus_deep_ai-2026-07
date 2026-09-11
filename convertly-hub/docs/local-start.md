# Локальний старт Convertly Hub

Це канонічна інструкція для запуску локального MVP: від чистого клону до першого адміністратора. Старий [START.md](./START.md) залишено як технічну довідку; для повсякденного старту використовуйте цей документ.

## 1. Що потрібно заздалегідь

- Node.js LTS і npm;
- Docker Desktop з увімкненим Linux engine;
- вільні порти `3000`, `3001`, `5432`, `9000`, `9001`, `1025` і `8025`;
- репозиторій із встановленими залежностями: `npm install`.

У PowerShell перевірте інструменти й Docker:

```powershell
node --version
npm --version
docker version
docker compose version
```

Якщо `docker version` не показує розділ `Server`, запустіть Docker Desktop і дочекайтеся статусу _Engine running_. Не переходьте до міграцій, доки Docker недоступний.

## 2. Налаштування `.env`

1. Якщо `.env` ще немає, створіть приватний файл із шаблону:

```powershell
Copy-Item .env.example .env
```

2. Якщо `.env` уже існує, **не перезаписуйте його**. Звірте його з `.env.example` і додайте відсутній локальний блок:

```dotenv
# Document conversion worker
GOTENBERG_URL=http://localhost:3000

# Local MailHog for password reset and email verification
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="Convertly Hub <no-reply@convertly.local>"
SMTP_SECURE=false
```

Ці п’ять значень потрібні відповідно для `DOCX → PDF` і для локальної доставки reset/verification-листів у MailHog. Вони не замінюють наявні секрети й не потребують production SMTP-облікових даних.

3. Замініть у `.env` усі значення-заглушки для `NEXTAUTH_SECRET`, паролів PostgreSQL і MinIO. Секрет сесії зручно згенерувати так:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

4. Не додавайте `.env` до Git. Його вже ігнорують; до репозиторію потрапляє лише `.env.example` без реальних секретів.

### Одна публічна адреса

`NEXTAUTH_URL` — єдиний публічний origin застосунку. Його використовують NextAuth і посилання для reset/verification email. Під час зміни `localhost` на домен змініть лише його, наприклад:

```dotenv
NEXTAUTH_URL=https://convertly.example
```

`APP_DOMAIN` і `APP_URL` не потрібні й не використовуються. Адреси `localhost` у `DATABASE_URL`, `MINIO_ENDPOINT`, `GOTENBERG_URL` і SMTP-налаштуваннях — це внутрішні локальні сервіси Docker. Вони не змінюються під час зміни публічного домену; у production їх замінюють адресами відповідних managed-сервісів.

`S3_REGION=us-east-1` у локальному шаблоні зберігає сумісність із MinIO. Для
S3-compatible managed storage (наприклад, Supabase) в окремому cloud environment
задається точний регіон, виданий провайдером; локальний `.env` змінювати для цього не
потрібно.

## 3. Перший запуск

Docker Desktop і Docker Compose — різні стани: запущений Docker Desktop означає, що доступний Docker Engine, але контейнери Convertly Hub ще можуть бути зупинені. Для повного локального запуску (БД, S3, DOCX → PDF і MailHog) обов’язково виконайте `docker compose up -d` і переконайтеся, що всі чотири сервіси мають статус `running`.

Із кореня `convertly-hub` виконайте:

```powershell
docker compose up -d
docker compose ps
npx prisma migrate deploy
npx prisma generate
npx next dev -p 3001
```

Очікувані сервіси у `docker compose ps`: `db`, `minio`, `gotenberg` і `mailhog`. Без них застосунок може відкрити частину UI, але міграції, health-check, сховище, `DOCX → PDF` або email-сценарії будуть недоступні.

Залиште останній процес запущеним і відкрийте `http://localhost:3001`. У деяких оболонках робочою альтернативою також буде:

```powershell
npm run dev -- --port 3001
```

`migrate deploy` застосовує лише відстежувані міграції та підходить для нового/наявного локального середовища. Для зміни Prisma-схеми розробник створює окрему міграцію через `npx prisma migrate dev --name <name>`; не використовуйте `migrate reset` для робочої бази з даними.

## 4. Перевірка після старту

### Інфраструктура

```powershell
docker compose exec -T db pg_isready
npx prisma migrate status
```

У браузері або через HTTP мають бути доступні:

- MinIO liveness: `http://localhost:9000/minio/health/live` — у браузері допустима порожня сторінка: ознака готовності — HTTP `200`. Альтернативний endpoint на `http://localhost:9001/minio/health/live` також повертає `200`;
- MinIO Console: `http://localhost:9001` — екран входу `http://localhost:9001/login` є очікуваною поведінкою;
- Gotenberg: `http://localhost:3000/health` — `up` для Chromium і LibreOffice;
- MailHog inbox: `http://localhost:8025`.

### Застосунок і API

1. Відкрийте `http://localhost:3001` і переконайтеся, що видно guest-конвертацію, вхід і реєстрацію.
2. Відкрийте `http://localhost:3001/api/health`. Повністю здоровий стан має відповідь HTTP `200`:

```json
{
  "status": "healthy",
  "database": "up",
  "storage": "up",
  "gotenberg": "up"
}
```

3. Виконайте єдиний локальний HTTP-аудит:

```powershell
npm run audit:api
```

Він зберігає актуальний звіт у `docs/audits/api-audit-latest.md` і перевіряє інфраструктуру, health API, NextAuth session і неавторизовані межі account/admin API.

4. Зареєструйте користувача: застосунок автоматично надішле одноразовий verification-лист до MailHog. Відкрийте нове посилання на `http://localhost:3001/...`; Dashboard залишається безпечним способом повторного надсилання. Потім увійдіть і перевірте browser-конвертацію `JPG ↔ PNG` або `DOCX → PDF`.

## 5. Перший адміністратор

1. Спочатку зареєструйте звичайного користувача через UI.
2. Впишіть його email у локальний `.env` як `SEED_ADMIN_EMAIL`.
3. Одноразово виконайте:

```powershell
npm run admin:seed-first
```

Скрипт не приймає пароль, призначає `ADMIN` лише зареєстрованому користувачеві, записує audit-подію та завершує роботу, якщо адміністратор уже є. Після цього увійдіть повторно й відкрийте `/management`.

## 6. Необов’язкова Telegram-прив’язка

Локальний UI та інші функції не потребують Telegram. Налаштовуйте `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` і `TELEGRAM_WEBHOOK_SECRET` лише після появи публічного HTTPS-домену: Telegram webhook не може звертатися до `localhost`. Потім спрямуйте webhook на `POST /api/telegram/webhook` із тим самим secret token. Після підтвердженої прив’язки користувач може запросити password reset за `@username`; Bot API надішле одноразове посилання лише до прив’язаного chat. Username зберігається з Telegram webhook і не вводиться у Dashboard. Публічні BotFather settings, команди та smoke-test описано в [telegram-bot-setup.md](./telegram-bot-setup.md).

## 7. Зупинка та діагностика

```powershell
# Остановить Next.js: Ctrl+C в его терминале
docker compose down
```

`docker compose down` зупиняє контейнери, але зберігає Docker volumes із PostgreSQL і MinIO. Не видаляйте volumes, якщо хочете зберегти локальні дані.

| Симптом                        | Що перевірити                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Docker daemon недоступний      | Запустити Docker Desktop; потім повторити `docker version` і `docker compose up -d`.                                                |
| Порт зайнятий                   | Знайти процес, звільнити порт або запустити Next.js на вільному порту й відповідно змінити лише локальний `NEXTAUTH_URL`.           |
| Prisma не підключається        | `docker compose ps`, збіг `POSTGRES_*` і `DATABASE_URL` у `.env`, потім `npx prisma migrate status`.                               |
| `/api/health` повертає `503`   | Перевірити поля JSON: `database`, `storage`, `gotenberg`; потім відповідний контейнер і адресу в `.env`.                            |
| Лист не надійшов               | Переконатися, що MailHog запущено, і відкрити `http://localhost:8025`; локальні SMTP-значення залиште з `.env.example`.             |

## 8. Корисні команди

```powershell
npm run linteslint
npx jest --runInBand
npm run build
npm run audit:api
npm run test:integration
npx prisma studio
```

`npm run test:integration` не використовує звичайний `.env` і локальний стек на порту
`3001`: він тимчасово піднімає окреме Docker Compose-середовище, запускає Next.js на
`3101` і після завершення видаляє лише тестові контейнери та volumes. Перед ним
потрібен запущений Docker Desktop. Повна інструкція й покриття — у
[integration-tests.md](./integration-tests.md). У разі падіння Playwright може створити
`test-results/` із trace, screenshot і error context; каталог ігнорується Git.

Докладна карта маршрутів міститься в [architecture.md](./architecture.md#5-api-endpoints), а актуальні межі browser і backend E2E — у [e2e_test_plan.md](./e2e_test_plan.md). Для окремої Oracle A1 production VM використовуйте не цю інструкцію, а [oracle-production-deployment.md](./oracle-production-deployment.md).

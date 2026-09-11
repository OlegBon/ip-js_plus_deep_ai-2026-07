# 🚀 Convertly Hub: Developer Start Guide

> **Статус на 8 вересня 2026:** Docker Compose, Prisma, NextAuth, RBAC, Telegram linking і recovery, Core-конвертацію, тарифні квоти, атомарне резервування storage та керування приватністю результатів перевірено. Публічне demo використовує Northflank + Supabase; Telegram reset вручну перевірено через підтверджений private chat. Browser-конвертація доступна після входу через `/`; API-ключ до браузера не передається. Реальний ізольований backend integration/E2E-набір перевіряє PostgreSQL, MinIO, Gotenberg, авторизацію, квоти, API-ключі й адміністративний API.

Внутрішній технічний посібник і журнал розгортання проєкту **Convertly Hub**. Для відтворюваного локального запуску використовуйте [local-start.md](./local-start.md): у ньому є preflight Docker, `.env.example`, міграції, перевірка, перший адміністратор і діагностика. Для окремої production VM Oracle A1 використовуйте [oracle-production-deployment.md](./oracle-production-deployment.md), а не локальний Compose.

---

## 🏗 1. Архітектура та мережеві порти (Services)

Інфраструктура проєкту працює в ізольованих Docker-контейнерах і пов’язана з локальним застосунком Next.js:

- **Next.js (frontend і health-check):** `http://localhost:3001` (порт `3000` зайнятий воркером).
- **Gotenberg (воркер документів):** `http://localhost:3000` (health-check: `http://localhost:3000/health`).
- **MinIO (S3-сумісне сховище файлів):**
  - API: `http://localhost:9000`
  - Web UI (Панель керування): `http://localhost:9001`
- **PostgreSQL (реляційна БД):** `localhost:5432`.
- **Prisma Studio (візуальна адмінка БД):** `http://localhost:5555` (запускається вручну).
- **MailHog (локальний SMTP й inbox):** SMTP `localhost:1025`, inbox `http://localhost:8025`.

---

## 📂 2. Створені конфігураційні файли

У межах налаштування базового каркасу було створено й налаштовано такі файли:

1. **`docker-compose.yml`** — оркестрація локальних сервісів (`convertly_db`, `convertly_minio`, `convertly_gotenberg`)[cite: 2].
2. **`.env`** — змінні середовища та рядок підключення до бази даних (`DATABASE_URL`, креденшіали MinIO, `NEXTAUTH_SECRET`)[cite: 2].
3. **`prisma.config.ts`** — конфігураційний файл Prisma 7 для зв’язки схеми й пулу підключень через драйвер `pg`[cite: 2].
4. **`prisma/schema.prisma`** — моделі даних бази (`User` і `ConversionLog`)[cite: 2].
5. **`app/api/health/route.ts`** — комплексний системний API-ендпоїнт для перевірки PostgreSQL, налаштованого S3-бакета та воркера Gotenberg[cite: 2].
6. **`package.json`** — маніфест залежностей (`@prisma/client`, `next-auth`, `@aws-sdk/client-s3`, `sharp`, `pg` тощо)[cite: 2].

Для S3-сервісу задайте в `.env` приватні змінні `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` і `MINIO_SECRET_KEY`. Не використовуйте для них префікс `NEXT_PUBLIC_`. Ім’я бакета задається `MINIO_BUCKET`; якщо змінну не вказано, використовується `convertly-files`.

Core використовує `GOTENBERG_URL` для адреси воркера документів; якщо змінну не задано, у локальному середовищі використовується `http://localhost:3000`. Значення не є секретом.

### Локальна пошта та production SMTP

Для password reset і підтвердження email Docker запускає MailHog без облікових даних. `NEXTAUTH_URL=http://localhost:3001` — єдиний публічний origin і для NextAuth, і для посилань у листах; локальні SMTP-параметри вказано в [`.env.example`](../.env.example). Листи з’являються в `http://localhost:8025`.

У production замініть `NEXTAUTH_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`; за потреби додайте приватні `SMTP_USER`, `SMTP_PASSWORD` і `SMTP_SECURE=true`. Ці значення залишаються лише в `.env`.

### Режим приватності результатів

Налаштування користувача `storeConversions` визначає поведінку API-конвертації:

- `true` — результат зберігається у приватному S3-об’єкті. Власник API-ключа використовує `GET /api/v1/conversions/:conversionId/download`, а власник NextAuth-сесії — `GET /api/account/conversions/:conversionId/download`.
- `false` — готовий файл надходить безпосередньо у відповіді `POST /api/v1/convert`; S3 не використовується, а відповідь позначено `Cache-Control: no-store`.

Не робіть бакет публічним і не додавайте presigned/public URL до клієнтського коду: доступ перевіряється сервером за API-ключем або HttpOnly-сесією.

### Browser-конвертация

1. Зарегистрируйте пользователя и войдите в аккаунт.
2. Откройте `/` и загрузите `JPG`, `PNG` или `DOCX` размером до 10 МБ.
3. Напрями: `JPG ↔ PNG` і `DOCX → PDF`. `PDF → DOCX` поки не реалізовано, тому PDF не приймається browser-віджетом.

Маршрут `POST /api/account/conversions` застосовує активний тариф і налаштування `storeConversions`. За зберігання він створює завдання, після чого головна сторінка безпечно очікує session-захищене завантаження; без зберігання відповідь Core одразу віддається на завантаження.

### Управление API-ключами

У Dashboard запити з NextAuth-сесією використовують `GET` і `POST /api/account/api-keys`, а відкликання ключа — `DELETE /api/account/api-keys/:apiKeyId`. Під час створення сервер повертає вихідний ключ рівно один раз із `Cache-Control: no-store`; збережіть його в менеджері секретів. У базі даних залишається лише SHA-256-хеш, тому отримати втрачений ключ повторно не можна — потрібно створити новий і відкликати попередній.

### Ліміти та серверна валідація конвертацій

`POST /api/v1/convert` допускає не більш як 30 запитів за хвилину на чинний API-ключ. У разі перевищення повертаються `429` і заголовок `Retry-After`; повторіть запит лише після вказаної паузи. І API, і browser-маршрут до читання файла в пам’ять перевіряють ліміт активного тарифу, MIME та цільовий формат, а Core потім звіряє сигнатуру файла. Лімітер зараз in-memory і розрахований на один інстанс застосунку; перед горизонтальним масштабуванням підключіть спільний Redis-сумісний backend.

### API админ-панели

Лише активний користувач із роллю `ADMIN` може звертатися до `GET /api/admin/users`, `PATCH /api/admin/users/:userId/status` і `DELETE /api/admin/api-keys/:apiKeyId`. Право повторно підтверджується запитом до БД, тому застаріла JWT-сесія заблокованого адміністратора не надає доступу. Не можна заблокувати власний обліковий запис через це API. Пошук підтримує `query`, `limit` від 1 до 50 і cursor-pagination; поточний пошук підрядком розраховано на MVP, а для великої БД знадобиться індекс `pg_trgm`.

---

## 🔄 3. Повсякденний робочий процес (Workflow)

Щоразу, коли сідаєш за розробку, виконуй такі кроки:

### Крок 1. Запуск інфраструктури (Docker)

Переконайся, що запущено **Docker Desktop**, після чого виконай в терміналі (у корені проєкту):

```bash
docker compose up -d
```

_(Прапор `-d` запускає контейнери у фоновому режимі)._

### Крок 2. Застосування міграцій бази даних (Prisma)

Після отримання проєкту або запуску нового локального середовища:

```bash
npx prisma migrate deploy
npx prisma generate
```

Якщо змінював `prisma/schema.prisma`, створи окрему міграцію в інтерактивному локальному терміналі, потім перевір її до застосування в спільних середовищах:

```bash
npx prisma migrate dev --name <краткое_название_изменения>
```

> У репозиторії є міграції RBAC/Telegram, тарифних квот і `20260826120000_quota_reservations` для атомарного резервування місця. До налаштування Telegram, призначення адміністратора або першої конвертації обов’язково застосуйте всі міграції командою `npx prisma migrate deploy`, потім виконайте `npx prisma generate`.

### Крок 2.1. Налаштування Telegram (після міграції)

У кореневому `.env` задайте приватний `TELEGRAM_BOT_TOKEN`, публічне ім’я `TELEGRAM_BOT_USERNAME` без `@` і непорожній унікальний `TELEGRAM_WEBHOOK_SECRET`. Не передавайте token або webhook secret через `NEXT_PUBLIC_*` і не додавайте `.env` до Git.

Після розгортання доступного через HTTPS застосунку налаштуйте Telegram webhook на `POST /api/telegram/webhook`, передавши той самий secret token, що збережено в `TELEGRAM_WEBHOOK_SECRET`. Користувач пов’язує акаунт із Dashboard: застосунок видає одноразовий deep link, дійсний 15 хвилин.

### Крок 2.2. Призначення першого адміністратора

1. Зареєструйте звичайний користувацький акаунт.
2. Укажіть його email у приватній змінній `.env` `SEED_ADMIN_EMAIL`.
3. Після застосування міграцій одноразово виконайте:

```bash
npm run admin:seed-first
```

Скрипт спрацює лише якщо в базі ще немає адміністратора, підвищить уже зареєстрованого користувача до `ADMIN` і створить audit-запис. Він не приймає пароль і не має використовуватися для подальших змін ролей.

### Крок 3. Запуск застосунку (Next.js)

```bash
npx next dev -p 3001
```

### 🛑 Як зупинити проєкт

- Зупинити сервер Next.js у терміналі: **`Ctrl + C`**
- Зупинити фонові контейнери Docker:

```bash
docker compose down

```

_(Дані бази не буде видалено завдяки налаштованому Docker Volume `db_data`)._

---

## 🎯 4. Точки контролю та перевірки (Health Checks)

Ти можеш будь-коли перевірити працездатність усіх шарів системи:

1. **PostgreSQL:** `docker compose exec -T db pg_isready` має підтвердити готовність бази.
2. **MinIO:** `http://localhost:9000/minio/health/live` має повернути успішну відповідь.
3. **Воркер Gotenberg:** `http://localhost:3000/health` має повернути JSON зі статусом `up` для Chromium і LibreOffice.
4. **MailHog:** `http://localhost:8025` відкриває локальний inbox; після запиту відновлення в ньому з’являється лист із посиланням.
5. **Системний API (Next.js + БД + S3 + воркер):** `http://localhost:3001/api/health`

- Успішна відповідь:

```json
{
  "status": "healthy",
  "database": "up",
  "storage": "up",
  "gotenberg": "up"
}
```

Якщо хоча б один core-сервіс недоступний, endpoint повертає `503` і безпечний JSON зі `status: "degraded"`; поля `database`, `storage` і `gotenberg` показують лише `up` або `down`, без помилок, лічильників і конфігурації. Для єдиної перевірки локальних HTTP-контрактів виконайте `npm run audit:api`: він також підтверджує гостьові межі session- і admin-захищених `GET`-маршрутів із [карти API](./architecture.md#5-api-endpoints).

Для Northflank + Supabase MVP задайте лише public origin застосунку:

```powershell
$env:API_AUDIT_BASE_URL = "https://convertly-hub.bon.kharkov.ua"
npm run audit:api
Remove-Item Env:API_AUDIT_BASE_URL
```

У віддаленому режимі аудит не звертається напряму до private Gotenberg, Supabase або
S3 Storage. Їхню готовність перевіряє public `GET /api/health`.

5. **Візуальна перевірка бази даних:**

```bash
npx prisma studio

```

Відкриє адмінку в браузері для перегляду таблиць `User` і `ConversionLog`.

---

## 📁 5. Політика завантаження файлів

- Дозволені вихідні файли `JPG`, `PNG` і `DOCX`. `PDF → DOCX` залишається planned, тому PDF поки не приймається як вихідний файл.
- Максимальний розмір одного файла — **10 МБ**.
- Фронтенд обмежує вибір файла за розширенням, MIME-типом і розміром, а API обов’язково повторює перевірку. Перевірка в браузері потрібна для зручності й не замінює серверний захист.
- У Core підтримуються `JPG ↔ PNG` і `DOCX → PDF`. `PDF → DOCX` потребуватиме окремого best-effort-конвертера: результат може втратити частину структури та форматування.

### Реальні integration/E2E-перевірки

```bash
npm run test:integration
```

Команда потребує запущеного Docker Desktop, тимчасово піднімає окремі тестові
PostgreSQL, MinIO, Gotenberg і MailHog, а потім видаляє лише цей ізольований
контур. Вона не змінює звичайний локальний стек і `.env`. Див.
[integration-tests.md](./integration-tests.md).

# 🚀 Convertly Hub: Developer Start Guide (START.md)

> **Статус на 22 августа 2026:** Docker Compose запущен и проверен: PostgreSQL, MinIO и Gotenberg доступны локально; Prisma подтверждает актуальность схемы. Серверный S3-сервис реализован и проверен с MinIO, но пользовательские потоки конвертации и аутентификации ещё не подключены к нему.

Внутреннее техническое руководство и лог развертывания проекта **Convertly Hub**.

---

## 🏗 1. Архитектура и сетевые порты (Services)

Инфраструктура проекта работает в изолированных Docker-контейнерах и связана с локальным приложением Next.js:

- **Next.js (frontend и health-check):** `http://localhost:3001` (порт `3000` занят воркером).
- **Gotenberg (воркер документов):** `http://localhost:3000` (health-check: `http://localhost:3000/health`).
- **MinIO (S3-совместимое хранилище файлов):**
  - API: `http://localhost:9000`
  - Web UI (Панель управления): `http://localhost:9001`
- **PostgreSQL (реляционная БД):** `localhost:5432`.
- **Prisma Studio (визуальная админка БД):** `http://localhost:5555` (запускается вручную).

---

## 📂 2. Созданные конфигурационные файлы

В рамках настройки базового каркаса были созданы и сконфигурированы следующие файлы:

1. **`docker-compose.yml`** — оркестрация локальных сервисов (`convertly_db`, `convertly_minio`, `convertly_gotenberg`)[cite: 2].
2. **`.env`** — переменные окружения и строка подключения к базе данных (`DATABASE_URL`, креды MinIO, `NEXTAUTH_SECRET`)[cite: 2].
3. **`prisma.config.ts`** — конфигурационный файл Prisma 7 для связки схемы и пула подключений через драйвер `pg`[cite: 2].
4. **`prisma/schema.prisma`** — модели данных базы (`User` и `ConversionLog`)[cite: 2].
5. **`app/api/health/route.ts`** — комплексный системный API-эндпоинт для проверки связи с базой данных и воркером Gotenberg[cite: 2].
6. **`package.json`** — манифест зависимостей (`@prisma/client`, `next-auth`, `@aws-sdk/client-s3`, `sharp`, `pg` и др.)[cite: 2].

Для S3-сервиса задайте в `.env` приватные переменные `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` и `MINIO_SECRET_KEY`. Не используйте для них префикс `NEXT_PUBLIC_`. Имя бакета задаётся `MINIO_BUCKET`; если переменная не указана, используется `convertly-files`.

---

## 🔄 3. Повседневный рабочий процесс (Workflow)

Каждый раз, когда ты садишься за разработку, выполняй следующие шаги:

### Шаг 1. Запуск инфраструктуры (Docker)

Убедись, что запущен **Docker Desktop**, после чего выполни в терминале (в корне проекта):

```bash
docker compose up -d
```

_(Флаг `-d` запускает контейнеры в фоновом режиме)._

### Шаг 2. Применение миграций базы данных (Prisma)

После получения проекта или запуска нового локального окружения:

```bash
npx prisma migrate deploy
npx prisma generate
```

Если изменял `prisma/schema.prisma`, создай отдельную миграцию в интерактивном локальном терминале, затем проверь её до применения в общих окружениях:

```bash
npx prisma migrate dev --name <краткое_название_изменения>
```

### Шаг 3. Запуск приложения (Next.js)

```bash
npm run dev -- --port 3001

```

### 🛑 Как остановить проект

- Остановить сервер Next.ж в терминале: **`Ctrl + C`**
- Остановить фоновые контейнеры Docker:

```bash
docker compose down

```

_(Данные базы не удалятся благодаря настроенному Docker Volume `db_data`)._

---

## 🎯 4. Точки контроля и проверки (Health Checks)

Ты можешь в любой момент проверить работоспособность всех слоев системы:

1. **PostgreSQL:** `docker compose exec -T db pg_isready` должен подтвердить готовность базы.
2. **MinIO:** `http://localhost:9000/minio/health/live` должен вернуть успешный ответ.
3. **Воркер Gotenberg:** `http://localhost:3000/health` должен вернуть JSON со статусом `up` для Chromium и LibreOffice.
4. **Системный API (Next.js + БД + воркер):** `http://localhost:3001/api/health`

- Успешный ответ:

```json
{
  "status": "healthy",
  "database": "connected",
  "users_in_db": 0,
  "gotenberg_worker": "up"
}
```

5. **Визуальная проверка базы данных:**

```bash
npx prisma studio

```

Откроет админку в браузере для просмотра таблиц `User` и `ConversionLog`.

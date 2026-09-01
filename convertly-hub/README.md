# 🛡️ Convertly Hub

> Современный SaaS-сервис для конвертации документов и файлов с предоставлением публичного API. Разработан в рамках задания на курсе "Javascript + deep AI" (Ivan Petrychenko, 2026-07) для демонстрации навыков Full Stack разработки и системной архитектуры.

---

## 🛠️ Технологический стек

- **Фронтенд / Оркестратор:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Бэкенд и API:** Next.js Route Handlers, NextAuth.js, Prisma ORM (v7)
- **База данных:** PostgreSQL (в Docker)
- **Файловое хранилище:** MinIO (S3-совместимое объектное хранилище)
- **Движок конвертации:** Gotenberg (Chromium + LibreOffice в изолированном контейнере)
- **Почта в локальной разработке:** MailHog; в production — настраиваемый SMTP-провайдер
- **Контейнеризация:** Docker Compose

---

## 📐 Архитектура проекта

Проект построен по принципу микросервисной изоляции тяжелых задач:

1. **Next.js** предоставляет UI, гостевую потоковую конвертацию, session-защищённые account/API-маршруты и публичный API по API-ключу.
2. **Prisma ORM** управляет пользователями, ролями, тарифами, API-ключами, Telegram-привязкой и журналом конвертаций в PostgreSQL.
3. **MinIO** хранит только приватные результаты, для которых пользователь включил хранение. Публичные S3 URL не создаются.
4. **Core** конвертирует `JPG ↔ PNG` через `sharp` и отправляет `DOCX → PDF` в Gotenberg. `PDF → DOCX` намеренно остаётся planned.

---

## 🚀 Быстрый старт (Локальная разработка)

Каноническое пошаговое руководство — [local-start.md](./docs/local-start.md). Техническая справка сохранена в [START.md](./docs/START.md).

1. Клонируйте репозиторий и установите зависимости:

```bash
git clone <url-репозитория>
cd convertly-hub
npm install
```

2. Поднимите инфраструктуру (PostgreSQL, MinIO, Gotenberg, MailHog) через Docker:

```bash
docker compose up -d
```

3. Создайте корневой `.env` из [`.env.example`](./.env.example) и заполните локальные секреты. Не добавляйте `.env` в Git.
4. Примените миграции базы данных и сгенерируйте Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. Запустите проект в режиме разработки:

```bash
npm run dev
```

---

## 📚 Документация

- [Архитектура проекта](./docs/architecture.md)
- [Технологии и SaaS](./docs/tech_saas.md)
- [План работ](./docs/work_plan.md)
- [Прогресс проекта](./docs/progress.md)
- [План E2E-тестирования](./docs/e2e_test_plan.md)
- [Реальные backend integration/E2E-тесты](./docs/integration-tests.md)
- [Локальный старт и диагностика](./docs/local-start.md)

## 🧪 Проверки

```bash
npm run linteslint
npx tsc --noEmit
npm test -- --runInBand
npm run test:e2e
npm run test:integration
```

Последняя команда поднимает отдельные PostgreSQL, MinIO, Gotenberg и MailHog,
выполняет реальные HTTP-сценарии и затем удаляет только свою тестовую Compose-среду.
Docker Desktop должен быть запущен. Подробности, порты и покрытие — в
[integration-tests.md](./docs/integration-tests.md). Артефакты неуспешного
Playwright-запуска сохраняются в локальной `test-results/` (она игнорируется Git)
и прикладываются к упавшему GitHub Actions run.

## ⚠️ Текущий статус

Реализованы аутентификация через HttpOnly-сессию, восстановление пароля и подтверждение email через одноразовые ссылки, роли `USER`/`ADMIN`, API-ключи, Telegram linking, тарифные квоты и Mock Checkout, приватное хранение в MinIO и доступные Core-конвертации. Гость может выполнить до трёх image- и двух document-конвертаций в месяц (до 1 МБ, без S3 и истории); зарегистрированный пользователь работает через сессию и получает тарифные возможности Dashboard.

Dashboard и Admin UI работают с реальными account/admin API. Реальный изолированный backend integration/E2E-набор уже покрывает PostgreSQL, MinIO, Gotenberg, авторизацию, квоты, API-ключи и администрирование. В [плане работ](./docs/work_plan.md) остаются реальные платежи, `PDF → DOCX`, распределённый rate limiter, расширение админской истории и production deployment.

Перед production deployment повторно проверьте [актуальную сводку dependency security](./docs/audits/dependency-security-latest.md): Prisma 7 обновлён до `7.10.0`, но стабильный путь NextAuth/Nodemailer 9 ещё требует отдельной migration-задачи.

---

## 🎥 Видео (YouTube)

- [2026-08-10 Демонстрация интерфейса и функционала](https://youtu.be/wYE38yYL1XE) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-12 Демонстрация интерфейса и функционала](https://youtu.be/UHdkW6_1QEw) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-15 Демонстрация интерфейса и функционала](https://youtu.be/CvLo-cgkQx8) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-16 Демонстрация интерфейса и функционала](https://youtu.be/qLZm8kayTsU) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-22 Демонстрация интерфейса и функционала](https://youtu.be/Dn_o8foUun0) - Краткий обзор реализованных страниц и их адаптивности.

---

## 📌 Основные эндпоинты

- `POST /api/auth/register` — регистрация с bcrypt-хешированием пароля.
- `POST /api/auth/password-reset/request` и `POST /api/auth/password-reset/confirm` — одноразовое восстановление пароля.
- `POST /api/account/email-verification` — отправка ссылки для подтверждения email в текущую сессию.
- `POST /api/account/conversions` — browser-конвертация для активной NextAuth-сессии.
- `POST /api/guest/conversions` — потоковая гостевая конвертация с cookie-квотой и локальным IP limiter.
- `GET /api/account/conversions/:conversionId/download` — session-защищённое скачивание сохранённого результата.
- `POST /api/v1/convert` — конвертация по Bearer API-ключу для тарифов с API-доступом.
- `GET /api/health` — безопасная проверка PostgreSQL, настроенного S3-бакета и Gotenberg: `200` при полном здоровье, `503` при деградации.

Полная карта маршрутов и правила ответов находятся в [architecture.md](./docs/architecture.md).

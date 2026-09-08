# 🛡️ Convertly Hub

Рабочий процесс удаления аккаунта описан в [документации по удалению аккаунта](./docs/account-deletion-workflow.md).

> Современный SaaS-сервис для конвертации документов и файлов с предоставлением публичного API. Разработан в рамках задания на курсе "Javascript + deep AI" (Ivan Petrychenko, 2026-07) для демонстрации навыков Full Stack разработки и системной архитектуры.

---

## 🛠️ Технологический стек

- **Фронтенд / Оркестратор:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Бэкенд и API:** Next.js Route Handlers, NextAuth.js, Prisma ORM (v7)
- **База данных:** PostgreSQL (локально — Docker Compose; публичный demo — Supabase)
- **Файловое хранилище:** S3-compatible API (локально — MinIO; публичный demo — private Supabase Storage)
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
- [Production-развёртывание на Oracle Cloud Free Tier](./docs/oracle-production-deployment.md)
- [План развёртывания на Vercel Pro](./docs/vercel-production-deployment.md)
- [План развёртывания на Render Paid / Free demo](./docs/render-production-deployment.md)
- [Функциональный demo MVP: Northflank Developer Sandbox + Supabase Free](./docs/northflank-supabase-demo.md)
- [Пошаговый запуск Northflank + Supabase](./docs/northflank-supabase-setup.md)
- [Нормализация тарифов и production-порядок migration](./docs/subscription-plan-migration.md)
- [Операционный one-off sync тарифа](./docs/northflank-supabase-setup.md#91-разово-синхронизировать-тариф-тестового-пользователя)
- [Подробные руководства по frontend, backend и database](./docs/guides/README.md)
- [PowerShell: публичный API](./docs/api-powershell.md)
- [Логический backup Supabase PostgreSQL](./docs/supabase-logical-backup.md)
- [Перенос между cloud providers](./docs/cloud-portability.md)
- [Активный backlog](./docs/backlog/README.md)
- [Исторический аудит документации, 7 сентября 2026](./docs/audits/documentation-audit-2026-09-07.md)
- [Финальный аудит документации, 8 сентября 2026](./docs/audits/documentation-audit-2026-09-08.md)

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

Реализованы аутентификация через HttpOnly-сессию, восстановление пароля по email или подтверждённому Telegram, подтверждение email через одноразовые ссылки, роли `USER`/`ADMIN`, API-ключи, тарифные квоты и Mock Checkout, приватное хранение в MinIO/S3-compatible storage, доступные Core-конвертации и контролируемый workflow удаления аккаунта. Гость может выполнить до трёх image- и двух document-конвертаций в месяц (до 1 МБ, без S3 и истории); зарегистрированный пользователь работает через сессию и получает тарифные возможности Dashboard.

Dashboard и Admin UI работают с реальными account/admin API. Реальный изолированный backend integration/E2E-набор уже покрывает PostgreSQL, MinIO, Gotenberg, авторизацию, квоты, API-ключи и администрирование. Текущий публичный demo — Northflank app + private Gotenberg, Supabase PostgreSQL и private Supabase S3 bucket; это функциональный MVP, но не billing-ready production. Oracle, Vercel и Render остаются подготовленными вариантами переноса. Перед migration или сменой provider создавайте [логический backup](./docs/supabase-logical-backup.md), а порядок cutover берите только из [cloud portability runbook](./docs/cloud-portability.md). Активные отложенные задачи находятся в [docs/backlog](./docs/backlog/README.md).

Перед production deployment повторно проверьте [актуальную сводку dependency security](./docs/audits/dependency-security-latest.md) и выполните `npm audit --omit=dev`. На 8 сентября 2026 audit возвращает `0 vulnerabilities`: Prisma-транзитивные `fast-uri` и `mysql2` закреплены узкими npm overrides. Не применяйте `npm audit fix --force`: major-обновление Prisma или NextAuth требует отдельного compatibility-аудита.

---

## 🎥 Видео (YouTube)

- [2026-09-08 Cloud MVP: Northflank + Supabase](https://youtu.be/gH8szKpm9MU) — screen recording публичного demo, PaaS-контуров и проверки dependency audit.
- [2026-09-02 Демонстрация интерфейса и функционала](https://youtu.be/-cZtM1-rf0Q) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-22 Демонстрация интерфейса и функционала](https://youtu.be/Dn_o8foUun0) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-16 Демонстрация интерфейса и функционала](https://youtu.be/qLZm8kayTsU) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-15 Демонстрация интерфейса и функционала](https://youtu.be/CvLo-cgkQx8) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-12 Демонстрация интерфейса и функционала](https://youtu.be/UHdkW6_1QEw) - Краткий обзор реализованных страниц и их адаптивности.
- [2026-08-10 Демонстрация интерфейса и функционала](https://youtu.be/wYE38yYL1XE) - Краткий обзор реализованных страниц и их адаптивности.

## 🖼️ Презентация

- [Convertly Hub — system overview (Canva)](https://canva.link/p7phuwtmnxaw3lb) — публичная презентация архитектуры и MVP; материал развивается вместе с проектом.

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

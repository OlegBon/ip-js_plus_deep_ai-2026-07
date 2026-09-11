# 🛡️ Convertly Hub

> Сучасний SaaS-сервіс для конвертації документів і файлів із наданням публічного API. Розроблений у межах завдання курсу "Javascript + deep AI" (Ivan Petrychenko, 2026-07) для демонстрації навичок Full Stack-розробки та системної архітектури.

Розгорнуто публічний функціональний demo [convertly-hub.bon.kharkov.ua](https://convertly-hub.bon.kharkov.ua/): Northflank public Next.js app, private Gotenberg, Supabase PostgreSQL і private S3-compatible Storage. Налаштовано DNS, TLS, SMTP, controlled Prisma migration job та smoke-tests.

Робочий процес видалення акаунта описано в [документації з видалення акаунта](./docs/account-deletion-workflow.md).

---

## 🛠️ Технологічний стек

- **Frontend / оркестратор:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend і API:** Next.js Route Handlers, NextAuth.js, Prisma ORM (v7)
- **База даних:** PostgreSQL (локально — Docker Compose; публічний demo — Supabase)
- **Файлове сховище:** S3-compatible API (локально — MinIO; публічний demo — private Supabase Storage)
- **Рушій конвертації:** Gotenberg (Chromium + LibreOffice в ізольованому контейнері)
- **Пошта в локальній розробці:** MailHog; у production — налаштовуваний SMTP-провайдер
- **Контейнеризація:** Docker Compose

---

## 📐 Архітектура проєкту

Проєкт побудовано за принципом мікросервісної ізоляції важких завдань:

1. **Next.js** надає UI, гостьову потокову конвертацію, захищені сесією account/API-маршрути та публічний API за API-ключем.
2. **Prisma ORM** керує користувачами, ролями, тарифами, API-ключами, Telegram-прив'язкою та журналом конвертацій у PostgreSQL.
3. **MinIO** зберігає лише приватні результати, для яких користувач увімкнув збереження. Публічні S3 URL не створюються.
4. **Core** конвертує `JPG ↔ PNG` через `sharp` і надсилає `DOCX → PDF` до Gotenberg. `PDF → DOCX` навмисно лишається planned.

---

## 🚀 Швидкий старт (локальна розробка)

Канонічний покроковий посібник — [local-start.md](./docs/local-start.md). Технічну довідку збережено в [START.md](./docs/START.md).

1. Клонуй репозиторій та встанови залежності:

```bash
git clone <url-репозиторія>
cd convertly-hub
npm install
```

2. Підніми інфраструктуру (PostgreSQL, MinIO, Gotenberg, MailHog) через Docker:

```bash
docker compose up -d
```

3. Створи кореневий `.env` із [`.env.example`](./.env.example) і заповни локальні секрети. Не додавай `.env` до Git.
4. Застосуй міграції бази даних і згенеруй Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. Запусти проєкт у режимі розробки:

```bash
npm run dev
```

---

## 📚 Документація

- [Архітектура проєкту](./docs/architecture.md)
- [Технології та SaaS](./docs/tech_saas.md)
- [План робіт](./docs/work_plan.md)
- [Прогрес проєкту](./docs/progress.md)
- [План E2E-тестування](./docs/e2e_test_plan.md)
- [Реальні backend integration/E2E-тести](./docs/integration-tests.md)
- [Локальний старт і діагностика](./docs/local-start.md)
- [Production-розгортання на Oracle Cloud Free Tier](./docs/oracle-production-deployment.md)
- [План розгортання на Vercel Pro](./docs/vercel-production-deployment.md)
- [План розгортання на Render Paid / Free demo](./docs/render-production-deployment.md)
- [Функціональний demo MVP: Northflank Developer Sandbox + Supabase Free](./docs/northflank-supabase-demo.md)
- [Покроковий запуск Northflank + Supabase](./docs/northflank-supabase-setup.md)
- [Нормалізація тарифів і production-порядок migration](./docs/subscription-plan-migration.md)
- [Операційний one-off sync тарифу](./docs/northflank-supabase-setup.md#91-разово-синхронизировать-тариф-тестового-пользователя)
- [Докладні посібники з frontend, backend і database](./docs/guides/README.md)
- [PowerShell: публічний API](./docs/api-powershell.md)
- [Логічний backup Supabase PostgreSQL](./docs/supabase-logical-backup.md)
- [Перенесення між cloud providers](./docs/cloud-portability.md)
- [Активний backlog](./docs/backlog/README.md)
- [Історичний аудит документації, 7 вересня 2026](./docs/audits/documentation-audit-2026-09-07.md)
- [Фінальний аудит документації, 8 вересня 2026](./docs/audits/documentation-audit-2026-09-08.md)

## 🧪 Перевірки

```bash
npm run linteslint
npx tsc --noEmit
npm test -- --runInBand
npm run test:e2e
npm run test:integration
```

Остання команда піднімає окремі PostgreSQL, MinIO, Gotenberg і MailHog,
виконує реальні HTTP-сценарії й потім видаляє лише власне тестове Compose-середовище.
Docker Desktop має бути запущено. Подробиці, порти та покриття — в
[integration-tests.md](./docs/integration-tests.md). Артефакти невдалого
запуску Playwright зберігаються в локальній `test-results/` (її ігнорує Git)
і додаються до невдалого GitHub Actions run.

## ⚠️ Поточний статус

Реалізовано автентифікацію через HttpOnly-сесію, відновлення пароля за email або підтвердженим Telegram, підтвердження email через одноразові посилання, ролі `USER`/`ADMIN`, API-ключі, тарифні квоти та Mock Checkout, приватне зберігання в MinIO/S3-compatible storage, доступні Core-конвертації та контрольований workflow видалення акаунта. Гість може виконати до трьох image- і двох document-конвертацій на місяць (до 1 МБ, без S3 та історії); зареєстрований користувач працює через сесію й отримує тарифні можливості Dashboard.

Dashboard та Admin UI працюють із реальними account/admin API. Реальний ізольований backend integration/E2E-набір уже покриває PostgreSQL, MinIO, Gotenberg, авторизацію, квоти, API-ключі й адміністрування. Поточний публічний demo — Northflank app + private Gotenberg, Supabase PostgreSQL і private Supabase S3 bucket; це функціональний MVP, але не billing-ready production. Oracle, Vercel і Render лишаються підготовленими варіантами перенесення. Перед migration або зміною provider створюй [логічний backup](./docs/supabase-logical-backup.md), а порядок cutover бери лише з [cloud portability runbook](./docs/cloud-portability.md). Активні відкладені завдання містяться в [docs/backlog](./docs/backlog/README.md).

Перед production deployment повторно перевір [актуальне зведення dependency security](./docs/audits/dependency-security-latest.md) і виконай `npm audit --omit=dev`. Станом на 8 вересня 2026 audit повертає `0 vulnerabilities`: Prisma-транзитивні `fast-uri` та `mysql2` закріплено вузькими npm overrides. Не застосовуй `npm audit fix --force`: major-оновлення Prisma або NextAuth потребує окремого compatibility-аудиту.

---

## 🎥 Відео (YouTube)

- [2026-09-08 Cloud MVP: Northflank + Supabase](https://youtu.be/gH8szKpm9MU) — screen recording публичного demo, PaaS-контуров и проверки dependency audit.
- [2026-09-02 Демонстрація інтерфейсу та функціональності](https://youtu.be/-cZtM1-rf0Q) — короткий огляд реалізованих сторінок і їхньої адаптивності.
- [2026-08-22 Демонстрація інтерфейсу та функціональності](https://youtu.be/Dn_o8foUun0) — короткий огляд реалізованих сторінок і їхньої адаптивності.
- [2026-08-16 Демонстрація інтерфейсу та функціональності](https://youtu.be/qLZm8kayTsU) — короткий огляд реалізованих сторінок і їхньої адаптивності.
- [2026-08-15 Демонстрація інтерфейсу та функціональності](https://youtu.be/CvLo-cgkQx8) — короткий огляд реалізованих сторінок і їхньої адаптивності.
- [2026-08-12 Демонстрація інтерфейсу та функціональності](https://youtu.be/UHdkW6_1QEw) — короткий огляд реалізованих сторінок і їхньої адаптивності.
- [2026-08-10 Демонстрація інтерфейсу та функціональності](https://youtu.be/wYE38yYL1XE) — короткий огляд реалізованих сторінок і їхньої адаптивності.

## 🖼️ Презентація

- [Convertly Hub — system overview (Canva)](https://canva.link/p7phuwtmnxaw3lb) — публічна презентація архітектури й MVP; матеріал розвивається разом із проєктом.

---

## 📌 Основні ендпоїнти

- `POST /api/auth/register` — реєстрація з bcrypt-хешуванням пароля.
- `POST /api/auth/password-reset/request` і `POST /api/auth/password-reset/confirm` — одноразове відновлення пароля.
- `POST /api/account/email-verification` — надсилання посилання для підтвердження email у поточну сесію.
- `POST /api/account/conversions` — browser-конвертація для активної NextAuth-сесії.
- `POST /api/guest/conversions` — потокова гостьова конвертація з cookie-квотою та локальним IP limiter.
- `GET /api/account/conversions/:conversionId/download` — session-захищене завантаження збереженого результату.
- `POST /api/v1/convert` — конвертація за Bearer API-ключем для тарифів із API-доступом.
- `GET /api/health` — безпечна перевірка PostgreSQL, налаштованого S3-бакета та Gotenberg: `200` за повного здоров'я, `503` за деградації.

Повна карта маршрутів і правила відповідей містяться в [architecture.md](./docs/architecture.md).

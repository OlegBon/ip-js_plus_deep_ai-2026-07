# ⚙️ Convertly Hub — технології та актуальний статус SaaS

Convertly Hub — вебсервіс і API для конвертації файлів. Цей документ описує
**фактично реалізований MVP**, поточний demo-контур і допустимі варіанти
наступного production-етапу. Докладні маршрути й потоки наведено в
[architecture.md](./architecture.md), а активні завдання — у
[backlog](./backlog/README.md).

> **Статус на 8 вересня 2026:** MVP реалізовано й покрито unit/route, browser
> E2E і реальним backend integration/E2E-набором. Функціональне публічне
> demo работает на Northflank + Supabase: Next.js app и private Gotenberg в
> Northflank, PostgreSQL і private S3-compatible Storage у Supabase. Це не
> замінює повноцінний production-план із перевіреним backup/restore,
> monitoring/alerting і SLA. Oracle A1, Vercel і Render залишаються альтернативами
> по [runbook перенесення](./cloud-portability.md).

---

## 1. Можливості MVP

### Конвертація та зберігання

- `JPG ↔ PNG` виконується бібліотекою `sharp`.
- `DOCX → PDF` виконується ізольованим сервісом Gotenberg.
- `PDF → DOCX` залишається запланованим: це не оборотне перетворення й
  потребує окремого best-effort конвертера та оцінки якості.
- Результати авторизованого користувача можуть зберігатися у приватному
  S3-сумісному сховищі або віддаватися без зберігання відповідно до privacy-налаштування.
  Доступ до збереженого файла надається лише через захищений download endpoint.
- Гість може без реєстрації виконати до 3 image- і 2 document-конвертацій на
  календарний місяць. Розмір файла — до 1 MB; гостьові файли не потрапляють до БД і
  S3, доступні у браузері до 10 хвилин і зникають під час очищення даних браузера.
- Для акаунтів діють квоти вибраного тарифу: число успішних конвертацій,
  розмір одного файла, обсяг і строк зберігання результатів. Актуальні значення
  відображаються на сторінці `/pricing` і контролюються сервером.

### Акаунти та доступ

- NextAuth v4 використовує JWT-сесії в HttpOnly cookies.
- Credentials-вхід зберігає лише bcrypt-хеш пароля. Email verification і password
  reset використовують одноразові хешовані токени; reset-посилання доставляється
  через SMTP або в уже підтверджений Telegram chat.
- Ролі: `USER` і `ADMIN`. Dashboard доступний обом ролям; `/management` — лише
  `ADMIN`.
- Telegram linking реалізовано через одноразове посилання, а password recovery
  працює лише через підтверджений chat ID; публічний username слугує лише
  lookup-ідентифікатором і зберігається з webhook update.
- API-ключ показується користувачеві рівно один раз під час створення; у базі зберігається
  лише SHA-256-хеш. API доступне тарифам, які його передбачають.

### API та контроль якості

- Основний API: `POST /api/v1/convert`; скачування збереженого результату:
  `GET /api/v1/conversions/:conversionId/download`.
- API й browser-конвертація валідують дозволені формати, розмір і сигнатури
  файлів на сервері. Зовнішньому MIME-типу довіряти не можна.
- Реалізовано in-memory rate limiter. Для кількох app instances знадобиться
  окремий Redis-сумісний спільний backend.
- `GET /api/health` перевіряє застосунок, PostgreSQL, S3 і Gotenberg.

---

## 2. Реалізований стек

| Зона            | Технології та призначення                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web/API         | Next.js 16 (App Router), React 19, TypeScript, Route Handlers                                                                                                       |
| UI              | Tailwind CSS 4, Radix primitives, власні компоненти, `class-variance-authority`, `clsx`, `tailwind-merge`, Lucide, `react-dropzone` і `sonner` для сповіщень |
| Автентифікація  | NextAuth 4, bcrypt, HttpOnly cookies, Nodemailer 9                                                                                                                  |
| Дані            | PostgreSQL 15 у local/Oracle Compose, managed PostgreSQL Supabase у demo; Prisma 7.10 з `@prisma/adapter-pg`                                                        |
| Сховище         | AWS SDK v3, S3-compatible API; локально — MinIO                                                                                                                     |
| Конвертація     | `sharp` для зображень, Gotenberg 8 для `DOCX → PDF`                                                                                                                 |
| Локальна пошта  | MailHog; він призначений лише для розробки й тестів                                                                                                                  |
| Перевірки       | ESLint, TypeScript, Prettier, Jest, Playwright, Docker Compose integration/E2E                                                                                      |
| CI              | GitHub Actions на push у будь-яку гілку: lint/types/Jest, browser E2E, реальні integration/E2E                                                                       |

Станом на 8 вересня 2026 `npm audit --omit=dev` повертає **0 vulnerabilities**.
Prisma 7.10 і Nodemailer 9.1 оновлено адресно; Prisma-транзитивні `fast-uri`
і `mysql2` закріплено вузькими npm overrides на виправлених версіях. Подробиці
й правило перегляду overrides містяться в [актуальному зведенні dependency
security](./audits/dependency-security-latest.md). NextAuth залишається на
стабільній v4. Будь-яке його major-оновлення потребує окремої перевірки breaking
changes і повного набору тестів — `npm audit fix --force` для цього проєкту
заборонено.

---

## 3. Середовища та інфраструктура

### Локальна розробка

`docker compose up -d` піднімає PostgreSQL, MinIO, Gotenberg і MailHog. Next.js
запускається на хості через `npm run dev`. Повний покроковий сценарій, діагностику,
міграції та першого адміністратора описано в [local-start.md](./local-start.md).

Ізольовані реальні integration/E2E використовують окремий Compose-стек,
окрему БД, bucket і порт. Вони не змінюють локальні дані:

```bash
npm run test:integration
```

### Oracle Cloud Free Tier — бажаний production-варіант

Один окремий ARM64 instance Oracle A1 у Frankfurt розміщує Caddy, Next.js,
PostgreSQL, MinIO та Gotenberg в одній private Docker-мережі. Ззовні відкриті лише
`80` і `443`; дані залишаються в persistent volumes. Production використовує реальний
SMTP `support@bon.kharkov.ua`, а не MailHog.

Це єдиний уже підготовлений deployment-контур репозиторію:
`Dockerfile`, `docker-compose.production.yml`, `deploy/Caddyfile` и
`.env.production.example`. Практичний порядок —
[oracle-production-deployment.md](./oracle-production-deployment.md).

До public go-live обов’язкові реальна VM, DNS, SMTP preflight, off-host backup і
перевірка відновлення. Free Tier capacity в Oracle не гарантована: якщо A1
недоступний у вибраному AD, це зовнішнє обмеження, а не помилка конфігурації.

### Vercel Pro — serverless-альтернатива

Vercel не запускає поточний Compose-стек як єдиний server. Для цього варіанта
потрібні керовані PostgreSQL і S3-compatible storage, а Gotenberg — окремий
закритий worker. Необхідно додатково спроєктувати безпечний зв’язок між
Vercel і worker до публікації. План без змін в акаунтах і коді міститься в
[vercel-production-deployment.md](./vercel-production-deployment.md).

### Render — container-альтернатива

Render Paid може розмістити Next.js і приватний Gotenberg як різні services;
PostgreSQL і S3-сховище краще використовувати керовані/зовнішні. Це ближче
до поточного Docker-підходу, але не є single-instance Free Tier варіантом.

Render Free + MailHog придатний лише для обмеженого тимчасового demo/preview:
обмеження free services не дають змоги безпечно й надійно розгорнути весь поточний
контур конвертації. Він не замінює production SMTP, persistent storage, private
Gotenberg і backup. Подробиці та контрольні точки —
[render-production-deployment.md](./render-production-deployment.md).

### Northflank Developer Sandbox + Supabase Free — функціональний demo

Для тимчасового публічного demo доступний окремий варіант: дві Northflank services
(`Next.js` public і `Gotenberg` private) та один Supabase project для PostgreSQL і
S3-compatible Storage. Він уникає об’єднання MinIO/Gotenberg, але залишається
demo-контуром: Northflank Developer Sandbox/free plan не призначений для production, а Supabase Free
може призупинити project за низької активності. Покроковий порядок, зокрема
GitHub build context `convertly-hub`, находится в
[northflank-supabase-demo.md](./northflank-supabase-demo.md).

---

## 4. Політика production-секретів і даних

- Секрети ніколи не комітяться. Локально вони містяться лише в кореневому `.env`,
  а у хмарі — у захищеному secrets/env-сховищі вибраного провайдера.
- `.env.example` і `.env.production.example` містять лише імена змінних і
  безпечні шаблони, а не реальні значення.
- `NEXTAUTH_SECRET`, паролі PostgreSQL/MinIO/SMTP і API credentials мають бути
  різними для локального, preview та production-середовищ.
- Production database, object storage і Gotenberg не мають мати публічних
  портів. Файли не видаються через public bucket URL.
- MailHog не можна використовувати для реальних користувачів: він не доставляє
  листи назовні й не призначений для захисту production-даних.
- До приймання користувацьких файлів перевіряється відновлення PostgreSQL і
  S3-бекапу поза самим production host.

---

## 5. Що ще не є production-ready

1. Реальні платежі та billing webhooks; поточна checkout-модалка — mock.
2. `PDF → DOCX`.
3. Redis/розподілений rate limiter для горизонтального масштабу.
4. Повна адмінська історія конвертацій, зокрема фільтр `FAILED`, деталі помилки та
   операції з файлами.
5. Автоматичні off-host backup/restore, зовнішній monitoring/alerting і CD.

Порядок і причини відкладених робіт описано в
[docs/backlog](./backlog/README.md). Перед будь-яким public запуском також повторно
перевіряються GitHub Actions, вручну `npm audit --omit=dev` і production
smoke-tests. Audit не є окремою командою поточного GitHub Actions workflow.

---

## 6. Документи для роботи

- [Архітектура й API-контракти](./architecture.md)
- [Локальний старт](./local-start.md)
- [Реальні backend integration/E2E](./integration-tests.md)
- [Oracle Cloud Free Tier runbook](./oracle-production-deployment.md)
- [Vercel Pro runbook-план](./vercel-production-deployment.md)
- [Render Paid / Free demo runbook-план](./render-production-deployment.md)
- [Northflank Developer Sandbox + Supabase Free demo MVP](./northflank-supabase-demo.md)
- [PowerShell: публічний API](./api-powershell.md)
- [Логический backup Supabase PostgreSQL](./supabase-logical-backup.md)
- [Перенос между cloud providers](./cloud-portability.md)
- [Докладні посібники за шарами](./guides/README.md)
- [Активний backlog](./backlog/README.md)

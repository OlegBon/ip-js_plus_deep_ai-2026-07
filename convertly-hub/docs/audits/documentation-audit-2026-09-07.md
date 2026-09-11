# Аудит документації — 7 вересня 2026

## Область і метод

Проведено два проходи: спочатку звірка документації з вихідним кодом, Prisma,
Dockerfile, Compose, scripts и GitHub/Northflank operational flow; затем
оновлення канонічних документів. Це не security audit і не навантажувальний тест.

## Фактична реалізація

| Область          | Підтверджений стан                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Web/API          | Next.js 16 App Router, Route Handlers, Node.js runtime для конвертаций.                                                  |
| Auth             | NextAuth v4 Credentials, HttpOnly JWT, регистрация, reset password, email verification, `USER`/`ADMIN`.                  |
| Billing          | Джерело тарифу — лише `Subscription.activePlan`; `User.plan` видалено migration `20260907140000`.                         |
| Конвертація      | `JPG ↔ PNG` через sharp; `DOCX → PDF` через Gotenberg; `PDF → DOCX` не реалізовано.                                     |
| Storage          | private S3-compatible bucket; ключі результатів user-scoped, публічні bucket URL не видаються.                          |
| API              | `POST /api/v1/convert` з Bearer key, місячною квотою та in-memory 30 req/min limit; download через owner-scoped endpoint. |
| Account deletion | request/cancel/process workflow, events audit trail, S3 cleanup, cascade delete, support SMTP notification.              |
| Production demo  | Northflank public app + private Gotenberg; Supabase PostgreSQL + private Storage; домен `convertly-hub.bon.kharkov.ua`.  |

## Тести

| Набір                | Команда                    | Що перевіряє                                                         |
| -------------------- | -------------------------- | -------------------------------------------------------------------- |
| Lint                 | `npm run linteslint`       | ESLint проекта.                                                      |
| Типи                 | `npx tsc --noEmit`         | TypeScript без emit.                                                 |
| Unit/route/component | `npm test -- --runInBand`  | Jest, React Testing Library и server contracts.                      |
| Browser E2E          | `npm run test:e2e`         | Playwright critical browser flows.                                   |
| Реальна інтеграція   | `npm run test:integration` | Ізольовані PostgreSQL, MinIO, Gotenberg, MailHog і HTTP scenario.   |

`test-results/` — локальний Playwright artifact невдалого запуску, він не
має потрапляти до Git. GitHub Actions запускають lint/types/Jest, Playwright E2E
та real backend integration/E2E окремо. Хмарний E2E, який змінює реальну
Supabase БД, навмисно не додано: він потребував би постійних test accounts,
неізольованих квот/пошти та підвищував би ризик зміни demo-даних. Реальний
ізольований Compose-набір залишається канонічною інтеграційною перевіркою,
а хмару перевіряють коротким manual smoke-test після deploy.

## Змінні оточення

| Група                  | Змінні                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| App origin/auth        | `NODE_ENV`, `APP_DOMAIN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`                                         |
| PostgreSQL             | `DATABASE_URL`; локально також `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` для Compose      |
| S3                     | `MINIO_ENDPOINT`, `S3_REGION`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`               |
| Conversion             | `GOTENBERG_URL`                                                                                     |
| Email/support          | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD`, `SUPPORT_EMAIL` |
| Telegram (необов'язково) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`                          |
| One-off only           | `SEED_ADMIN_EMAIL`, `PLAN_SYNC_EMAIL`, `PLAN_SYNC_ACTIVE_PLAN`; ніколи не persistent app secrets   |

`NEXTAUTH_SECRET`, `DATABASE_URL`, S3 и SMTP credentials — server-only secrets.
`SUPPORT_EMAIL` — не секрет. Шаблони `.env.example` та
`.env.production.example` не містять фактичних credentials.

## Хмарна конфігурація та операції

- Northflank `convertly-app` строит Git subdirectory `/convertly-hub` с target
  `runner`; private Gotenberg слушает port `3000` и имеет health check
  `/health`.
- `convertly-migrate` использует Docker target `migration` и узкую группу
  `convertly-migration-runtime` только с `NODE_ENV` и `DATABASE_URL`.
- Будь-яка нова Prisma migration: logical backup → push/build latest main →
  migration job → app deployment → `/api/health` и smoke-test. Для UI-only
  commit migration job не запускается.
- `Dockerfile` target `migration` встановлює `openssl`, тому попереднє
  Prisma попередження щодо libssl усунено.
- Supabase Free не дає покладатися на managed backup; інструкцію CLI додано
  в [supabase-logical-backup.md](../supabase-logical-backup.md).

## Виявлені розбіжності та підсумок

1. `tech_saas.md`, `architecture.md` і README описували стан до публічного
   Northflank + Supabase demo. Їх оновлено до фактичного стану.
2. У `work_plan.md` змішувалися історія виконаних задач і active backlog.
   Історію збережено, але єдиним активним списком тепер є
   [docs/backlog](../backlog/README.md).
3. Не було канонічного PowerShell API flow з `conversionId` і коректним
   обробленням `409`. Додано [api-powershell.md](../api-powershell.md).
4. Не було одного незалежного provider runbook. Додано
   [cloud-portability.md](../cloud-portability.md), включая PostgreSQL/S3/DNS/
   secrets/cutover/rollback.

## Залишкові усвідомлені обмеження

- Немає payment provider і webhook-based billing.
- Немає `PDF → DOCX`.
- Rate limit не придатний для кількох app instances без Redis.
- Немає автоматизованих off-host backup/restore, monitoring/alerting і CD.
- Telegram recovery реалізовано після початкового audit: migration, production
  deploy, webhook, Dashboard-прив'язку, reset за `@username`, зміну пароля та
  повторний вхід перевірено вручну.

Усі пункти перенесено до тематичного [backlog](../backlog/README.md), а не
змішуються із завершеною історією проєкту.

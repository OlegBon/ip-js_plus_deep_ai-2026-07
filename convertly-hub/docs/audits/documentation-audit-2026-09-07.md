# Аудит документации — 7 сентября 2026

## Область и метод

Проведены два прохода: сначала сверка документации с исходниками, Prisma,
Dockerfile, Compose, scripts и GitHub/Northflank operational flow; затем
обновление канонических документов. Это не security audit и не нагрузочный тест.

## Фактическая реализация

| Область          | Подтверждённое состояние                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Web/API          | Next.js 16 App Router, Route Handlers, Node.js runtime для конвертаций.                                                  |
| Auth             | NextAuth v4 Credentials, HttpOnly JWT, регистрация, reset password, email verification, `USER`/`ADMIN`.                  |
| Billing          | Источник тарифа — только `Subscription.activePlan`; `User.plan` удалён migration `20260907140000`.                       |
| Конвертация      | `JPG ↔ PNG` через sharp; `DOCX → PDF` через Gotenberg; `PDF → DOCX` не реализован.                                       |
| Storage          | private S3-compatible bucket; ключи результатов user-scoped, публичные bucket URL не выдаются.                           |
| API              | `POST /api/v1/convert` с Bearer key, месячной квотой и in-memory 30 req/min limit; download через owner-scoped endpoint. |
| Account deletion | request/cancel/process workflow, events audit trail, S3 cleanup, cascade delete, support SMTP notification.              |
| Production demo  | Northflank public app + private Gotenberg; Supabase PostgreSQL + private Storage; домен `convertly-hub.bon.kharkov.ua`.  |

## Тесты

| Набор                | Команда                    | Что проверяет                                                        |
| -------------------- | -------------------------- | -------------------------------------------------------------------- |
| Lint                 | `npm run linteslint`       | ESLint проекта.                                                      |
| Типы                 | `npx tsc --noEmit`         | TypeScript без emit.                                                 |
| Unit/route/component | `npm test -- --runInBand`  | Jest, React Testing Library и server contracts.                      |
| Browser E2E          | `npm run test:e2e`         | Playwright critical browser flows.                                   |
| Реальная интеграция  | `npm run test:integration` | Изолированные PostgreSQL, MinIO, Gotenberg, MailHog и HTTP scenario. |

`test-results/` — локальный Playwright artifact неуспешного запуска, он не
должен попадать в Git. GitHub Actions запускают lint/types/Jest, Playwright E2E
и real backend integration/E2E раздельно. Облачный E2E, который меняет реальную
Supabase БД, намеренно не добавлен: он требовал бы постоянных test accounts,
неизолированных квот/почты и повышал риск изменения demo-данных. Реальный
изолированный Compose-набор остаётся канонической интеграционной проверкой,
а облако проверяется коротким manual smoke-test после deploy.

## Переменные окружения

| Группа                 | Переменные                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| App origin/auth        | `NODE_ENV`, `APP_DOMAIN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`                                         |
| PostgreSQL             | `DATABASE_URL`; локально также `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` для Compose      |
| S3                     | `MINIO_ENDPOINT`, `S3_REGION`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`               |
| Conversion             | `GOTENBERG_URL`                                                                                     |
| Email/support          | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD`, `SUPPORT_EMAIL` |
| Telegram (опционально) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`                            |
| One-off only           | `SEED_ADMIN_EMAIL`, `PLAN_SYNC_EMAIL`, `PLAN_SYNC_ACTIVE_PLAN`; никогда не persistent app secrets   |

`NEXTAUTH_SECRET`, `DATABASE_URL`, S3 и SMTP credentials — server-only secrets.
`SUPPORT_EMAIL` — не секрет. Шаблоны `.env.example` и
`.env.production.example` не содержат фактических credentials.

## Облачная конфигурация и операции

- Northflank `convertly-app` строит Git subdirectory `/convertly-hub` с target
  `runner`; private Gotenberg слушает port `3000` и имеет health check
  `/health`.
- `convertly-migrate` использует Docker target `migration` и узкую группу
  `convertly-migration-runtime` только с `NODE_ENV` и `DATABASE_URL`.
- Любая новая Prisma migration: logical backup → push/build latest main →
  migration job → app deployment → `/api/health` и smoke-test. Для UI-only
  commit migration job не запускается.
- `Dockerfile` target `migration` устанавливает `openssl`, поэтому прежнее
  Prisma предупреждение о libssl устранено.
- Supabase Free не даёт полагаться на managed backup; инструкция CLI добавлена
  в [supabase-logical-backup.md](../supabase-logical-backup.md).

## Найденные расхождения и итог

1. `tech_saas.md`, `architecture.md` и README описывали состояние до публичного
   Northflank + Supabase demo. Они обновлены до фактического состояния.
2. В `work_plan.md` смешивались история выполненных задач и active backlog.
   История сохранена, но единственным активным списком теперь является
   [docs/backlog](../backlog/README.md).
3. Не было канонического PowerShell API flow с `conversionId` и корректной
   обработкой `409`. Добавлен [api-powershell.md](../api-powershell.md).
4. Не было одного независимого provider runbook. Добавлен
   [cloud-portability.md](../cloud-portability.md), включая PostgreSQL/S3/DNS/
   secrets/cutover/rollback.

## Оставшиеся осознанные ограничения

- Нет payment provider и webhook-based billing.
- Нет `PDF → DOCX`.
- Rate limit не пригоден для нескольких app instances без Redis.
- Нет автоматизированных off-host backup/restore, monitoring/alerting и CD.
- Telegram recovery реализован после исходного audit: migration, production
  deploy, webhook, Dashboard-привязка, reset по `@username`, смена пароля и
  повторный вход вручную проверены.

Все пункты перенесены в тематический [backlog](../backlog/README.md), а не
смешиваются с завершённой историей проекта.

# Фінальний аудит документації — 8 вересня 2026

## Мета та джерела звірки

Цей прохід фіксує стан після cloud migration, Telegram recovery,
account deletion, уніфікації Dashboard UX та адресного dependency security fix.
Твердження звірено з `package.json`/`package-lock.json`, `Dockerfile`, Compose,
`.env.example`, Prisma schema и migrations, `app/api/**`, `lib/**`, GitHub
Actions, активним backlog і опублікованими матеріалами проєкту. Це не замінює
security-аудит або навантажувальне тестування.

## Підсумкова звірка

| Область                            | Канонічний документ                    | Підтверджений стан                                                                                                                                                     |
| ---------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Швидкий вхід і публічні матеріали  | `README.md`                            | Локальний Compose і публічний Northflank + Supabase demo розділено; додано посилання на cloud video та Canva presentation.                                            |
| Архітектура та API                 | `architecture.md`                      | Описано browser/API/guest conversion, private Gotenberg/S3, SMTP, Telegram recovery, deletion workflow та portability.                                                |
| Дані                               | `db-schema.md`                         | Prisma schema залишається джерелом істини; тариф зберігається лише у `Subscription.activePlan`, User-plan legacy column видалено.                                    |
| Технології та хмара                | `tech_saas.md`                         | Зафіксовано фактичний Next.js/Prisma/Supabase/Northflank stack, local/production межі та альтернативи Oracle, Vercel, Render.                                         |
| Практичні шари                     | `guides/*`                             | Розділено frontend UX/polling, backend flows, database locks/migrations та testing/operations.                                                                        |
| Security dependencies              | `audits/dependency-security-latest.md` | `npm audit --omit=dev` повертає 0 vulnerabilities; виправлені Prisma-транзитивні версії закріплено вузькими overrides.                                                |
| Майбутня робота                    | `backlog/*`                            | Активні лише billing, conversion capabilities, security/scale, operations/reliability й admin conversion history. Виконані задачі залишаються у Git і `progress.md`. |

## Матеріали проєкту

- [Cloud MVP video (YouTube)](https://youtu.be/gH8szKpm9MU) — німий screen
  recording публічного demo та PaaS-контуру.
- [System overview (Canva)](https://canva.link/p7phuwtmnxaw3lb) — публічна
  презентація архітектури та MVP, що розвивається.

До README додано лише зовнішні посилання. Скриншоти та Canva-export не зберігаються у
Git, щоб репозиторій не отримав важкі бінарні файли, що швидко застарівають.
Публічні матеріали не мають показувати паролі, connection strings, API keys,
SMTP/S3 credentials, Telegram bot token або значення secret groups.

## Усвідомлені межі після аудиту

1. Demo на Northflank Developer Sandbox + Supabase Free функціональний, але не
   надає SLA, гарантованого backup, постійної доступності або production
   monitoring/alerting.
2. Billing залишається mock: зміна `Subscription.activePlan` вручну допустима
   лише як операційний тестовий процес до підключення payment provider.
3. Реальний cloud E2E навмисно не автоматизовано: він змінював би Supabase data,
   квоти та delivery channels. Канонічний автоматизований контур —
   ізольований Docker Compose integration/E2E; після deploy виконується
   короткий ручний smoke-test.
4. `npm audit fix --force` не застосовується. За нового finding спочатку потрібен
   dependency-path/compatibility audit, потім tests і production build.

## Результат

Документація відображає поточний мінімальний функціональний стан продукту.
Нові product або infrastructure ідеї додаються лише до тематичного
`docs/backlog/`; завершені зміни фіксуються merge-комітом і
`docs/progress.md`.

# Финальный аудит документации — 8 сентября 2026

## Цель и источники сверки

Этот проход фиксирует состояние после cloud migration, Telegram recovery,
account deletion, унификации Dashboard UX и адресного dependency security fix.
Утверждения сверены с `package.json`/`package-lock.json`, `Dockerfile`, Compose,
`.env.example`, Prisma schema и migrations, `app/api/**`, `lib/**`, GitHub
Actions, активным backlog и опубликованными материалами проекта. Это не заменяет
security-аудит или нагрузочное тестирование.

## Итоговая сверка

| Область                            | Канонический документ                  | Подтверждённое состояние                                                                                                                                               |
| ---------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Быстрый вход и публичные материалы | `README.md`                            | Локальный Compose и публичный Northflank + Supabase demo разделены; добавлены ссылки на cloud video и Canva presentation.                                              |
| Архитектура и API                  | `architecture.md`                      | Описаны browser/API/guest conversion, private Gotenberg/S3, SMTP, Telegram recovery, deletion workflow и portability.                                                  |
| Данные                             | `db-schema.md`                         | Prisma schema остаётся источником истины; тариф хранится только в `Subscription.activePlan`, User-plan legacy column удалена.                                          |
| Технологии и облако                | `tech_saas.md`                         | Зафиксированы фактический Next.js/Prisma/Supabase/Northflank stack, local/production границы и альтернативы Oracle, Vercel, Render.                                    |
| Практические слои                  | `guides/*`                             | Разделены frontend UX/polling, backend flows, database locks/migrations и testing/operations.                                                                          |
| Security dependencies              | `audits/dependency-security-latest.md` | `npm audit --omit=dev` возвращает 0 vulnerabilities; исправленные Prisma-транзитивные версии закреплены узкими overrides.                                              |
| Будущая работа                     | `backlog/*`                            | Активны только billing, conversion capabilities, security/scale, operations/reliability и admin conversion history. Выполненные задачи остаются в Git и `progress.md`. |

## Материалы проекта

- [Cloud MVP video (YouTube)](https://youtu.be/gH8szKpm9MU) — немой screen
  recording публичного demo и PaaS-контура.
- [System overview (Canva)](https://canva.link/p7phuwtmnxaw3lb) — публичная
  развиваемая презентация архитектуры и MVP.

В README добавлены только внешние ссылки. Скриншоты и Canva-export не хранятся в
Git, чтобы репозиторий не получил тяжёлые быстро устаревающие бинарные файлы.
Публичные материалы не должны показывать пароли, connection strings, API keys,
SMTP/S3 credentials, Telegram bot token или значения secret groups.

## Осознанные границы после аудита

1. Demo на Northflank Developer Sandbox + Supabase Free функционален, но не
   даёт SLA, гарантированного backup, постоянной доступности или production
   monitoring/alerting.
2. Billing остаётся mock: смена `Subscription.activePlan` вручную допустима
   только как операционный тестовый процесс до подключения payment provider.
3. Реальный cloud E2E намеренно не автоматизирован: он менял бы Supabase data,
   квоты и delivery channels. Канонический автоматизированный контур —
   изолированный Docker Compose integration/E2E; после deploy выполняется
   короткий ручной smoke-test.
4. `npm audit fix --force` не применяется. При новом finding сначала нужен
   dependency-path/compatibility audit, затем tests и production build.

## Результат

Документация отражает текущее минимальное функциональное состояние продукта.
Новые product или infrastructure идеи добавляются только в тематический
`docs/backlog/`; завершённые изменения фиксируются merge-коммитом и
`docs/progress.md`.

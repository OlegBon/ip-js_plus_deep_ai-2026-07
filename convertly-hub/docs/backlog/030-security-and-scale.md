# 030 — Security и масштабирование

## Distributed rate limit

Текущий лимит API-ключа (30 запросов/минуту) in-memory и корректен только для
одного app instance. Перед horizontal scaling перенести счётчик в Redis-
совместимое хранилище и покрыть конкурентные сценарии integration-тестами.

## Поиск в Admin

Перед ростом списка пользователей проверить планы запросов поиска по имени/email
и при необходимости добавить PostgreSQL `pg_trgm` index через отдельную Prisma
migration.

## Security review

После любого крупного изменения auth, payments, Storage policy или provider
проводить отдельный security audit, `npm audit --omit=dev` и проверку secrets.

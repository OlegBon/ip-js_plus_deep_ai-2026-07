# 030 — Security і масштабування

## Distributed rate limit

Поточний ліміт API-ключа (30 запитів/хвилину) in-memory і коректний лише для
одного app instance. Перед horizontal scaling перенести лічильник до Redis-
сумісного сховища та покрити конкурентні сценарії integration-тестами.

## Поиск в Admin

Перед зростанням списку користувачів перевірити плани запитів пошуку за ім'ям/email
і за потреби додати PostgreSQL `pg_trgm` index через окрему Prisma
migration.

## Security review

Після будь-якої великої зміни auth, payments, Storage policy або provider
проводити окремий security audit, `npm audit --omit=dev` і перевірку secrets.

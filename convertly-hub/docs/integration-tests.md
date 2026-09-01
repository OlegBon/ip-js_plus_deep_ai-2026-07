# Реальные backend integration/E2E-тесты

`npm run test:integration` проверяет реальные HTTP-контракты на изолированных
PostgreSQL, MinIO, Gotenberg и MailHog. Обычный `.env`, `docker-compose.yml` и
локальный сервер на порту 3001 не используются.

## Локальный запуск

```bash
npm run test:integration
```

Команда сама поднимает и после завершения удаляет только контейнеры, сеть и volumes
Compose-проекта `convertly-integration`. Docker Desktop должен быть запущен.

Тестовые сервисы используют порты `55432`, `59000`, `53000`, `51025` и `58025`.
Runner применяет миграции только к `convertly_integration`, запускает Next.js на
`127.0.0.1:3101` с отдельной папкой `.next-integration` и очищает созданные
тестовые записи и S3-объекты.

Gotenberg не использует Docker healthcheck, зависящий от утилит внутри его образа.
Вместо этого integration spec ожидает положительный ответ приложения
`GET /api/health` (PostgreSQL, MinIO и Gotenberg) до 60 секунд. Это проверяет
фактическую готовность нужного HTTP-контракта и одинаково работает локально и в CI.

## Покрываемые контракты

- health-check PostgreSQL, MinIO и Gotenberg;
- регистрация, Credentials login и HttpOnly-сессия;
- API-ключ, асинхронная API-конвертация и защищённое скачивание из MinIO;
- API-конвертация без сохранения результата;
- guest image-квота и `DOCX → PDF` через Gotenberg;
- доступ администратора к user-management API.

GitHub Actions запускает этот набор в отдельной job `Real backend integration/E2E`.
В CI сервисами управляет workflow, поэтому runner не запускает и не останавливает их.

Playwright создаёт `test-results/` только при диагностике неуспешного запуска
(trace, screenshot и error context). Локальный каталог игнорируется Git; в GitHub
Actions он прикладывается к упавшему run вместе с логами тестовых сервисов.

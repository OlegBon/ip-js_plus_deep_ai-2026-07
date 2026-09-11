# Реальні backend integration/E2E-тести

`npm run test:integration` перевіряє реальні HTTP-контракти на ізольованих
PostgreSQL, MinIO, Gotenberg і MailHog. Звичайні `.env`, `docker-compose.yml` та
локальний сервер на порту 3001 не використовуються.

## Локальний запуск

```bash
npm run test:integration
```

Команда сама запускає та після завершення видаляє лише контейнери, мережу й volumes
Compose-проєкту `convertly-integration`. Docker Desktop має бути запущений.

Тестові сервіси використовують порти `55432`, `59000`, `53000`, `51025` і `58025`.
Runner застосовує міграції лише до `convertly_integration`, запускає Next.js на
`127.0.0.1:3101` з окремою папкою `.next-integration` й очищує створені
тестові записи та S3-об'єкти.

Gotenberg не використовує Docker healthcheck, що залежить від утиліт усередині його образу.
Натомість integration spec очікує позитивну відповідь застосунку
`GET /api/health` (PostgreSQL, MinIO і Gotenberg) упродовж 60 секунд. Це перевіряє
фактичну готовність потрібного HTTP-контракту й однаково працює локально та у CI.

## Покриті контракти

- health-check PostgreSQL, MinIO і Gotenberg;
- реєстрація, реальна SMTP-доставка verification email до MailHog, Credentials login
  і HttpOnly-сесія;
- API-ключ, асинхронна API-конвертація та захищене завантаження з MinIO;
- API-конвертація без збереження результату;
- guest image-квота та `DOCX → PDF` через Gotenberg;
- доступ адміністратора до user-management API.

GitHub Actions запускає цей набір в окремій job `Real backend integration/E2E`.
У CI сервісами керує workflow, тому runner не запускає та не зупиняє їх.

Playwright створює `test-results/` лише під час діагностики невдалого запуску
(trace, screenshot і error context). Локальний каталог ігнорується Git; у GitHub
Actions він додається до невдалого run разом із логами тестових сервісів.

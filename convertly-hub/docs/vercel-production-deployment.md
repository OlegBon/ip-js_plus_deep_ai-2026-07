# Vercel Pro: production runbook-план

Цей документ — план вибору та безпечного розгортання, а **не** інструкція для
негайного запуску. Станом на 2 вересня 2026 у репозиторії немає Vercel-конфігурації,
Vercel-акаунт не змінюється, а production-секрети не створюються.

Vercel Pro підходить для Next.js-застосунку, але не замінює поточний єдиний Docker
server: PostgreSQL, S3-сховище та Gotenberg мають бути окремими managed
сервісами. Для комерційного публічного проєкту обирається Pro, а не Hobby.
Актуальні умови й ціна перевіряються у [Vercel Pricing](https://vercel.com/pricing) безпосередньо перед замовленням.

## 1. Целевая схема

```text
Browser
  └─ Vercel Pro: Next.js / Route Handlers
       ├─ Managed PostgreSQL
       ├─ S3-compatible private object storage
       ├─ SMTP provider
       └─ authenticated conversion worker (Gotenberg)
```

- **PostgreSQL:** обирається managed PostgreSQL із підтримкою підключення Prisma у
  serverless-середовищі та connection pooling. До вибору звіряються регіон, backup,
  ліміт з’єднань, вартість і процедура відновлення.
- **Object storage:** private S3-compatible bucket. MinIO з локального Compose
  тут не запускається; провайдер обирається окремо (наприклад, R2/S3) після
  перевірки сумісності endpoint, регіону, credentials і lifecycle rules.
- **Gotenberg:** виділений worker, недоступний анонімно з інтернету. Не можна
  публікувати стандартний Gotenberg endpoint без додаткової автентифікації.
  Потрібні private networking або окремий auth-проксі/підписаний service-to-service
  запит і потім зміна застосунку з тестами.
- **SMTP:** реальний SMTP скриньки `support@bon.kharkov.ua` після перевірки host,
  TLS, порту, SPF, DKIM і DMARC. MailHog на Vercel не використовується.

## 2. Що потрібно вирішити до налаштування Vercel

1. Підтвердити бюджет: Vercel Pro і кожен зовнішній production-сервіс оплачуються
   окремо; поточні ціни та included usage не фіксуються в цьому документі.
2. Вибрати один регіон, близький до користувачів, і підтвердити, що PostgreSQL,
   bucket і worker перебувають у сумісних регіонах.
3. Вибрати конкретних PostgreSQL, S3 і worker providers. Зафіксувати їх в
   окремому рішенні, зокрема SLA, quotas, backups, data residency і egress.
4. Спроєктувати закритий доступ Vercel → worker. Публічний URL worker допустимий
   лише після реалізації автентифікації на рівні gateway/worker і перевірки
   відмови неавторизованих запитів.
5. Перевірити ліміти Vercel на request body, execution duration і memory для
   максимального розміру файла кожного тарифу. У разі невідповідності потрібен direct
   upload у storage й окремий job/worker flow — це окреме архітектурне
   завдання, а не налаштування environment variables.
6. Узгодити production-domain `convertly-hub.bon.kharkov.ua` і зберегти
   можливість швидко повернути DNS на попередній робочий контур.

## 3. Практичний порядок окремого deployment-завдання

### 3.1. Підготовка сервісів

1. Створити managed PostgreSQL і private bucket, увімкнути backup/lifecycle та
   виконати тестове відновлення поза production.
2. Розгорнути закритий Gotenberg worker і реалізувати перевірюваний механізм його
   автентифікації. Додати unit/integration/E2E-тести для service-to-service
   доступу й відмови зовнішньому клієнту.
3. Створити production SMTP credentials у панелі поштового провайдера; значення не
   копіюються до документації, GitHub Actions logs або клієнтського `NEXT_PUBLIC_*`.

### 3.2. Налаштування Vercel

1. Імпортувати **папку `convertly-hub` як Root Directory** монорепозиторію.
   Не деплоїти батьківську папку з іншими навчальними проєктами.
2. Створити окремі Vercel environments: Preview і Production. Секрети кожного
   середовища різні; Preview не має звертатися до production database/bucket.
3. Додати server-only variables: `DATABASE_URL`, `NEXTAUTH_URL`,
   `NEXTAUTH_SECRET`, SMTP-налаштування, S3-налаштування і URL/credentials worker.
   Звірити імена з `.env.production.example`; не створювати `NEXT_PUBLIC_` копії
   секретів.
4. Налаштувати `convertly-hub.bon.kharkov.ua` у Vercel і лише потім змінити
   DNS-записи в uh.ua відповідно до наданої Vercel інструкції. Після propagation
   перевірити HTTPS і redirect policy.
5. Міграції не запускаються в кожному serverless deploy. Застосувати
   `npx prisma migrate deploy` окремим контрольованим job/CI step із
   production connection string, після backup і до перемикання трафіку.
6. Після підтвердження першого email запустити `npm run admin:seed-first` із
   безпечного адміністраторського середовища з production `DATABASE_URL`, не з browser
   і не з публічного Route Handler.

### 3.3. Smoke-test і відкат

Перевірити `GET /api/health`, реєстрацію, verification email, login, reset password,
guest quota, усі три доступні напрями конвертації, privacy mode, Dashboard,
API key і admin access. Повний набір CI має бути зеленим до release.

Відкат Vercel deployment не замінює відновлення даних. Для проблем коду
повернути попередній deployment; для міграцій і даних використовувати заздалегідь
перевірені backup/restore runbook вибраних providers.

## 4. Межі та критерій готовності

Не можна оголошувати цей варіант production-ready, доки не виконано всі пункти:

- обрано й протестовано закритий conversion worker;
- підтверджено сумісність file-size/timeouts із Vercel;
- роздільні секрети та бази Preview/Production створено безпечно;
- протестовано backup і restore PostgreSQL/bucket;
- DNS, SMTP, HTTPS і всі production smoke-tests успішні.

Доки ці умови не виконано, продовжуйте використовувати локальне середовище або
Oracle runbook. Цей план не змінює наявний Oracle deployment-контур.

## 5. Офіційні джерела для наступного завдання

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel: environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: monorepos](https://vercel.com/docs/monorepos)
- [Vercel: custom domains](https://vercel.com/docs/domains)
- [Prisma: deploying to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)

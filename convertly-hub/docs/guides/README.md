# Технічні посібники за шарами Convertly Hub

Цей розділ потрібен для глибокого читання вихідного коду. Він не замінює
[architecture.md](../architecture.md): архітектура показує загальну схему й API,
а ці посібники ведуть конкретними файлами, відповідальностями та ланцюжками виконання.

## З чого почати

1. [Frontend](./frontend.md) — сторінки, клієнтські компоненти, стан і шлях
   файлу від Dropzone до завантаження.
2. [Backend / server](./backend.md) — Route Handlers, авторизація, валідація,
   Core, storage, квоти й фонові задачі.
3. [Database](./database.md) — Prisma-моделі, зв'язки, індекси, міграції та
   узгодженість тарифних даних.
4. [Тести та операції](./testing-and-operations.md) — який набір тестів захищає
   кожен шар, локальна інфраструктура, health-check, CI, migration job, backup
   і безпечний deploy-порядок.

## Як читати один користувацький сценарій

Для прикладу browser-конвертації авторизованого користувача рухайтеся в такому порядку:

```text
app/page.tsx
  → components/core/FileDropzone.tsx
  → POST /api/account/conversions
  → lib/api/conversion-request.ts
  → lib/core/conversion-job.ts
  → lib/core/conversion.ts + lib/privacy/conversion-results.ts
  → PostgreSQL ConversionLog + private MinIO/S3
  → GET /api/account/conversions/:id/download
  → components/dashboard/ConversionHistory.tsx
```

У гостя перші два кроки такі самі, але Route Handler інший —
`/api/guest/conversions`; він не створює `ConversionLog` і не пише до S3. Результат
тимчасово лежить у browser IndexedDB через `lib/client/guest-conversion-cache.ts`.

## Принципи навігації

- `app/**/page.tsx` — екран або layout; `app/api/**/route.ts` — HTTP-межа.
- `components/**` — відображення й браузерні дії, без прямого Prisma/S3.
- `lib/**` — server business logic, адаптери та спільні політики.
- `prisma/schema.prisma` — єдине джерело моделі даних; SQL лежить лише
  у послідовних `prisma/migrations/*/migration.sql`.
- `__tests__` поруч із модулем перевіряє його локальний контракт; `e2e/` перевіряє
  користувацькі та реальні сервісні сценарії цілком.

У всіх прикладах нижче не копіюються секрети з `.env`. Змінні оточення
використовуються лише на сервері; `NEXT_PUBLIC_*` не має містити пароль,
connection string, S3 credential або SMTP credential.

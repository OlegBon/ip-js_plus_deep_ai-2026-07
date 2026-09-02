# Технические руководства по слоям Convertly Hub

Этот раздел нужен для глубокого чтения исходников. Он не заменяет
[architecture.md](../architecture.md): архитектура показывает общую схему и API,
а эти руководства ведут по конкретным файлам, обязанностям и цепочкам выполнения.

## С чего начать

1. [Frontend](./frontend.md) — страницы, клиентские компоненты, состояние и путь
   файла от Dropzone до скачивания.
2. [Backend / server](./backend.md) — Route Handlers, авторизация, валидация,
   Core, storage, квоты и фоновые задачи.
3. [Database](./database.md) — Prisma-модели, связи, индексы, миграции и
   согласованность тарифных данных.
4. [Тесты и операции](./testing-and-operations.md) — какой набор тестов защищает
   каждый слой, локальная инфраструктура, health-check и CI.

## Как читать один пользовательский сценарий

Для примера browser-конвертации авторизованного пользователя идите в таком порядке:

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

У гостя первые два шага те же, но Route Handler другой —
`/api/guest/conversions`; он не создаёт `ConversionLog` и не пишет в S3. Результат
временно лежит в browser IndexedDB через `lib/client/guest-conversion-cache.ts`.

## Принципы навигации

- `app/**/page.tsx` — экран или layout; `app/api/**/route.ts` — HTTP-граница.
- `components/**` — отображение и браузерные действия, без прямого Prisma/S3.
- `lib/**` — server business logic, адаптеры и общие политики.
- `prisma/schema.prisma` — единственный источник модели данных; SQL лежит только
  в последовательных `prisma/migrations/*/migration.sql`.
- `__tests__` рядом с модулем проверяет его локальный контракт; `e2e/` проверяет
  пользовательские и реальные сервисные сценарии целиком.

Во всех примерах ниже не копируются секреты из `.env`. Переменные окружения
используются только на сервере; `NEXT_PUBLIC_*` не должно содержать пароль,
connection string, S3 credential или SMTP credential.

# 060 — Адмінська історія конвертацій і failed jobs

## Проблема

`System Monitoring` уже показує загальну кількість конвертацій і failed jobs, але
адмін не може з інтерфейсу зрозуміти, яка саме задача впала, для якого
облікового запису, на якому етапі та чи є збережений результат. Зараз для цього
потрібно відкривати Prisma Studio, що незручно й надто близько до прямого доступу
до production-даних.

## Запропонований інтерфейс

Не окрема сторінка й не набір модалок поверх System Monitoring. На
`/management` додати самостійний блок **Conversion history** під
моніторингом і поруч із User Management. Так метрики лишаються коротким зведенням, а
операційна таблиця має достатньо місця для фільтрів і пагінації.

### Таблиця та фільтри

- cursor-пагінація по 20 записів, default sort `createdAt desc`;
- пошук за email користувача та назвою вихідного файлу;
- filter: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` і «зі збереженим
  результатом»;
- сортування: дата створення, статус, формат, розмір і дата завершення;
- стовпці: час, користувач (name/email), вихідна назва, `source → target`,
  розмір, status, тривалість, наявність/строк результату;
- `Refresh` із видимим часом останнього успішного оновлення, як у Account
  Deletion Requests;
- empty/error state без технічних exception і без хибного «порожньо» у разі
  невдалого запиту.

### Failed details

У `FAILED` має бути кнопка **Details**, що відкриває невелику модалку з
безпечною діагностикою: conversion ID, час, формат, розмір, status і
нормалізована категорія (`validation`, `conversion-engine`, `storage`,
`timeout`, `unknown`). Не показувати raw stack trace, credentials, S3 endpoint,
object key, вихідний вміст файлу або повний provider response.

Перший етап не виконує автоматичний retry: повторний запуск може повторно
списати квоту, створити дублікат і ускладнити audit. Повторну обробку слід
проєктувати окремою задачею з явними правилами quota/idempotency.

### Дії з результатом

Якщо `storageKey` існує, admin може натиснути **Delete stored file** та
підтвердити дію. Сервер перевіряє `ADMIN`, видаляє лише private S3
object, потім атомарно очищує `storageKey`/метадані результату в записі.
Сам `ConversionLog` і failed history не видаляються. Потрібен audit event: хто,
коли та який conversion ID очистив. Жодних public download URL і масового
видалення у першій версії.

## Серверний контракт

1. `GET /api/admin/conversions` — лише `ADMIN`; validated query parameters:
   `search`, `status`, `stored`, `sort`, `direction`, `cursor`. Ответ содержит
   safe view model, `nextCursor` и `total`.
2. `GET /api/admin/conversions/:id` — safe detail для модалки, лише `ADMIN`.
3. `DELETE /api/admin/conversions/:id/stored-result` — destructive route з
   окремим confirmation UI; ідемпотентно повертає зрозумілу відповідь, якщо файл
   вже видалено/сплив.
4. Нова Prisma migration додає мінімальну append-only audit model для
   admin cleanup. Не змінювати вже застосовані migrations.

Для списку використовувати select лише потрібних полів і cursor, не повертати
`sourceFileHash`, `storageKey`, `errorMessage` без нормалізації та пов'язані
API-key hashes. Пошук/сортування — allowlist, аналогічно наявним account/
admin endpoints.

## Тести та перевірка

- Jest: RBAC, query validation, cursor, email/file search, details redaction,
  delete happy path, S3 failure і idempotency;
- component tests: filters, pagination, refresh timestamp, modal confirmation,
  error/empty states;
- Playwright: admin sees list/details/delete action; non-admin не бачить UI та
  отримує `403` від route;
- real integration/E2E: створити `COMPLETED` і `FAILED` conversion, перевірити
  S3 delete та збереження audit record;
- manual Northflank smoke-test: перевірити, що raw secrets/error data не
  виводяться у browser console або service logs.

## Критерії готовності

- число `failed conversions` у System Monitoring веде до практичного потоку
  діагностики, а не лише показує цифру;
- дії суворо owner-independent, але лише для `ADMIN`;
- storage cleanup не видаляє account/history і не робить результат публічним;
- великі списки не використовують `OFFSET`;
- регресії Dashboard history та API-key download не з'являються.

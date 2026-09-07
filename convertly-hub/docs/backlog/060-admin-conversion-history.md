# 060 — Админская история конвертаций и failed jobs

## Проблема

`System Monitoring` уже показывает общее число конвертаций и failed jobs, но
админ не может из интерфейса понять, какая именно задача упала, для какого
аккаунта, на каком этапе и есть ли сохранённый результат. Сейчас для этого
нужно открывать Prisma Studio, что неудобно и слишком близко к прямому доступу
к production-данным.

## Предлагаемый интерфейс

Не отдельная страница и не набор модалок поверх System Monitoring. На
`/management` добавить самостоятельный блок **Conversion history** под
мониторингом и рядом с User Management. Так метрики остаются краткой сводкой, а
операционная таблица имеет достаточно места для фильтров и пагинации.

### Таблица и фильтры

- cursor-пагинация по 20 записей, default sort `createdAt desc`;
- поиск по email пользователя и имени исходного файла;
- filter: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` и «с сохранённым
  результатом»;
- сортировка: дата создания, статус, формат, размер и дата завершения;
- столбцы: время, пользователь (name/email), исходное имя, `source → target`,
  размер, status, продолжительность, наличие/срок результата;
- `Refresh` с видимым временем последнего успешного обновления, как в Account
  Deletion Requests;
- empty/error state без технических exception и без ложного «пусто» при
  неуспешном запросе.

### Failed details

У `FAILED` должна быть кнопка **Details**, открывающая небольшую модалку с
безопасной диагностикой: conversion ID, время, формат, размер, status и
нормализованная категория (`validation`, `conversion-engine`, `storage`,
`timeout`, `unknown`). Не показывать raw stack trace, credentials, S3 endpoint,
object key, исходное содержимое файла или полный provider response.

Первый этап не выполняет автоматический retry: повторный запуск может повторно
списать квоту, создать дубликат и усложнить audit. Повторную обработку следует
проектировать отдельной задачей с явными правилами quota/idempotency.

### Действия с результатом

Если `storageKey` существует, admin может нажать **Delete stored file** и
подтвердить действие. Сервер проверяет `ADMIN`, удаляет только private S3
object, затем атомарно очищает `storageKey`/метаданные результата в записи.
Сам `ConversionLog` и failed history не удаляются. Нужен audit event: кто,
когда и какой conversion ID очистил. Никаких public download URL и массового
удаления в первой версии.

## Серверный контракт

1. `GET /api/admin/conversions` — только `ADMIN`; validated query parameters:
   `search`, `status`, `stored`, `sort`, `direction`, `cursor`. Ответ содержит
   safe view model, `nextCursor` и `total`.
2. `GET /api/admin/conversions/:id` — safe detail для модалки, только `ADMIN`.
3. `DELETE /api/admin/conversions/:id/stored-result` — destructive route с
   отдельным confirmation UI; идемпотентно возвращает понятный ответ, если файл
   уже удалён/истёк.
4. Новая Prisma migration добавляет минимальный append-only audit model для
   admin cleanup. Не изменять уже применённые migrations.

Для списка использовать select только нужных полей и cursor, не возвращать
`sourceFileHash`, `storageKey`, `errorMessage` без нормализации и связанные
API-key hashes. Поиск/сортировка — allowlist, аналогично существующим account/
admin endpoints.

## Тесты и проверка

- Jest: RBAC, query validation, cursor, email/file search, details redaction,
  delete happy path, S3 failure и idempotency;
- component tests: filters, pagination, refresh timestamp, modal confirmation,
  error/empty states;
- Playwright: admin sees list/details/delete action; non-admin не видит UI и
  получает `403` от route;
- real integration/E2E: создать `COMPLETED` и `FAILED` conversion, проверить
  S3 delete и сохранение audit record;
- manual Northflank smoke-test: проверить, что raw secrets/error data не
  выводятся в browser console или service logs.

## Критерии готовности

- число `failed conversions` в System Monitoring ведёт в практический поток
  диагностики, а не только показывает цифру;
- действия строго owner-independent, но только для `ADMIN`;
- storage cleanup не удаляет account/history и не делает результат публичным;
- большие списки не используют `OFFSET`;
- регрессии Dashboard history и API-key download не появляются.

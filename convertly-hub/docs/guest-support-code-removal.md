# Отключение и удаление Guest support code

Этот runbook относится к guest-функции: месячный код вида `GUEST-XXXX-XXXX-XXXX-XXXX`,
который показывается на главной странице и позволяет support-команде сбросить лимит
конкретного браузера через one-off job. Он не связан с API keys, аккаунтами или
историей конвертаций зарегистрированных пользователей.

Сначала выберите нужный уровень изменений:

| Цель | Рекомендуемый вариант |
| --- | --- |
| Быстро перестать показывать коды и пользоваться reset job | [Отключить](#1-отключить-без-миграции-бд) |
| Полностью убрать код, job, тесты и колонку БД из продукта | [Удалить полностью](#2-полное-удаление-из-кода-и-бд) |

Начинайте с отключения. Полное удаление является отдельной кодовой задачей и имеет
необратимую часть — последующую Prisma-миграцию.

## 1. Отключить без миграции БД

Этот вариант безопасен для production и обратим. Конвертации гостей и их месячные
лимиты продолжают работать; исчезают только code, его запись в БД и возможность
ручного reset по code.

1. В Northflank откройте secret group `convertly-app-runtime`.
2. Удалите переменную `GUEST_SUPPORT_CODE_SECRET` либо отключите group от
   `convertly-app` только после переноса остальных обязательных переменных в другую
   group. Не удаляйте `DATABASE_URL`, SMTP-данные или `NEXTAUTH_SECRET`.
3. Сохраните изменение и выполните **Rollout restart** `convertly-app`.
4. Не запускайте `convertly-migrate` для этого шага: схема БД не меняется.
5. В инкогнито-окне откройте:

   ```text
   https://convertly-hub.bon.kharkov.ua/api/guest/conversions
   ```

   При существующей guest-квоте ответ должен содержать `supportCode: null`, а на
   главной странице не должно быть блока **Guest support code**.

6. Для `convertly-migrate` верните постоянный CMD к обычному:

   ```text
   npx prisma migrate deploy
   ```

   Если когда-либо использовался временный override
   `node scripts/reset-guest-quota.mjs`, он не должен оставаться постоянной
   командой migration job. Разовое `GUEST_SUPPORT_CODE` не сохраняйте в secret
   group или настройках job.

`supportCodeHash` и ранее записанные хеши останутся в PostgreSQL. Они не являются
исходными code и не дают возможности восстановить cookie гостя. Это нормальное
состояние до решения о полном удалении.

## 2. Полное удаление из кода и БД

Выполняйте только после того, как вариант 1 уже некоторое время работает и feature
точно больше не нужна. До начала сделайте backup Supabase и зафиксируйте текущий
успешный Northflank build: у удаления нет автоматического down-migration.

### 2.1. Подготовить отдельную ветку

Создайте отдельную ветку, например:

```powershell
git switch main
git pull --ff-only
git switch -c chore/remove-guest-support-code
```

Не меняйте применённую миграцию
`prisma/migrations/20260904130000_guest_support_code/migration.sql`: она уже
записана в таблице `_prisma_migrations` production-базы.

### 2.2. Удалить прикладной код и тесты

Удалите code из следующих частей, затем обновите импорты и тесты:

- `lib/guest/support-code.ts` и `lib/guest/__tests__/support-code.test.ts`;
- `scripts/reset-guest-quota.mjs`, `scripts/guest-quota-reset-core.mjs` и их тесты;
- `components/core/GuestConversionSummary.tsx` — prop, блок code и Copy;
- `components/core/__tests__/GuestSupportCode.test.tsx`;
- `app/page.tsx` — `supportCode` в guest state, чтение JSON и header;
- `app/api/guest/conversions/route.ts` — импорт helpers, вычисление code,
  `supportCodeHash` в upsert/update, header `X-Guest-Support-Code` и поле ответа;
- `Dockerfile` — копирование reset scripts в target `migration`;
- `prisma/schema.prisma` — поле `GuestConversionQuota.supportCodeHash`.

Сохраните саму `GuestConversionQuota`: guest-лимиты по cookie остаются продуктовой
функцией. Также не удаляйте local guest download history — это независимая
browser-only возможность.

### 2.3. Создать новую миграцию

После удаления поля из `schema.prisma` создайте **новую** migration локально:

```powershell
npx prisma migrate dev --name remove_guest_support_code
```

Проверьте generated SQL. В PostgreSQL он должен удалять unique index
`GuestConversionQuota_supportCodeHash_key` и затем колонку `supportCodeHash`; не
должен трогать таблицу `GuestConversionQuota` целиком, её counters или другие
таблицы.

### 2.4. Привести документацию и cloud-настройки в соответствие

Удалите или актуализируйте упоминания `GUEST_SUPPORT_CODE_SECRET`,
`GUEST_SUPPORT_CODE` и reset job в:

- `.env.production.example`;
- `docs/northflank-supabase-setup.md`;
- `docs/architecture.md`, `docs/db-schema.md`, `docs/guides/backend.md`,
  `docs/guides/frontend.md`, `docs/guides/database.md`;
- `docs/progress.md`, `README.md` и этот runbook.

В Northflank после rollout удалите `GUEST_SUPPORT_CODE_SECRET` из
`convertly-app-runtime`. Если для reset создавалась отдельная secret group или
временная job, отключите либо удалите их. Обычный `convertly-migrate` оставьте:
он нужен для всех будущих Prisma migrations.

### 2.5. Проверить до merge

Минимальный набор:

```powershell
npm run linteslint
npx tsc --noEmit
npm test -- --runInBand
npm run test:e2e
npm run test:integration
```

Ручная проверка: guest JPG ↔ PNG и DOCX → PDF всё ещё соблюдают месячные лимиты,
но API `GET /api/guest/conversions` больше не возвращает `supportCode`, UI не
показывает code, а account/API-key конвертации работают без изменений.

### 2.6. Деплой в Northflank

1. Выполните явный merge в `main`, дождитесь зелёного GitHub Actions.
2. Соберите актуальный `convertly-migrate` от нового `main` и вручную запустите
   job. В логах проверьте применение новой migration.
3. Соберите и задеплойте актуальный `convertly-app`.
4. Только после успешных smoke-checks удалите cloud secret и неиспользуемые
   reset-настройки.

Порядок «migration, затем app» исключает ситуацию, когда новый app обращается к
уже удалённой колонке. На время деплоя не выполняйте ручные reset guest-квот.

## 3. Возврат до полного удаления

Если выполнен только раздел 1, восстановите прежнее значение
`GUEST_SUPPORT_CODE_SECRET` в `convertly-app-runtime` и сделайте rollout restart.
Коды начнут отображаться для существующих browser cookies после обновления
главной страницы. Если раздел 2 уже задеплоен, возврат требует отдельной feature
ветки с новым полем, новой migration и новым секретом; старую migration нельзя
переиспользовать или редактировать.

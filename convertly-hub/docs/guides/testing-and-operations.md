# Тесты и операции: как убедиться, что слои работают вместе

## 1. Пирамида проверок

| Уровень              | Команда                                  | Что проверяет                                         | Где искать                        |
| -------------------- | ---------------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Стиль и типы         | `npm run linteslint`, `npx tsc --noEmit` | TypeScript, React/Next rules, imports                 | весь проект                       |
| Unit/component/route | `npm test`                               | isolated business/UI/HTTP contracts                   | `**/__tests__/*.test.*`           |
| Browser E2E          | `npm run test:e2e`                       | критические публичные user flows в Chromium           | `e2e/critical-flows.spec.ts`      |
| Real integration/E2E | `npm run test:integration`               | реальные PostgreSQL, MinIO, Gotenberg, MailHog и HTTP | `e2e/backend-integration.spec.ts` |
| API audit            | `npm run audit:api`                      | договорённые HTTP responses на запущенном сервисе     | `scripts/audit-api.mjs`           |

`npm test` не требует Docker. `test:integration` создаёт изолированный Compose
stack и после успеха удаляет его; не направляйте его на локальную рабочую БД.
Подробный запуск — [integration-tests.md](../integration-tests.md).

## 2. Как тесты связаны с кодом

- `components/core/__tests__/FileDropzone.test.tsx` защищает disabled/upload/error/
  success states common dropzone.
- `lib/core/__tests__/conversion*.test.ts` проверяет допустимые направления и job
  lifecycle без реального браузера.
- `app/api/**/__tests__/route.test.ts` проверяют конкретный HTTP contract: status,
  auth, validation и отсутствие опасных данных в response.
- `components/dashboard/__tests__/ConversionHistory.test.tsx` проверяет поиск,
  cursor paging, availability и download affordance.
- `e2e/critical-flows.spec.ts` использует устойчивые role/label locators и ждёт
  наблюдаемый результат, а не `waitForTimeout`.
- `e2e/backend-integration.spec.ts` проходит реальный путь auth → quota → storage
  → API conversion → admin на отдельных сервисах.

Когда меняется behaviour, меняется соответствующий тест. Например, добавление
password eye сделало `getByLabel('Password')` неоднозначным, потому что и input, и
button получили label. Корректный Playwright locator тогда:

```ts
await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Show Password' })).toBeVisible();
```

## 3. Локальный операционный контур

Основной local stack:

```text
Next.js (host :3001)
  ├─ PostgreSQL (Docker :5432)
  ├─ MinIO API (:9000) / Console (:9001)
  ├─ Gotenberg (:3000)
  └─ MailHog SMTP (:1025) / UI (:8025)
```

Команды, порядок `.env`, миграции, health response и первого администратора
зафиксированы в [local-start.md](../local-start.md). Не заменяйте основной `.env`
шаблоном целиком: добавляйте отсутствующие keys из `.env.example` и сохраняйте
локальные secrets.

Проверка готового stack:

```bash
npm run audit:api
curl http://localhost:3001/api/health
```

Ожидаемый `/api/health` при полностью запущенной инфраструктуре:

```json
{
  "status": "healthy",
  "database": "up",
  "storage": "up",
  "gotenberg": "up"
}
```

Если один dependency недоступен, это не причина отключать health check: сначала
проверьте `docker compose ps`, container logs и соответствующую environment
variable. `MailHog` не участвует в данном health response, но нужен для ручной
проверки verification/reset email.

## 4. CI и артефакты

GitHub Actions запускается на push в любую ветку, когда затронут `convertly-hub`.
Jobs разделены, поэтому failure browser E2E не должен загрязнять real integration
containers:

1. **Lint, types and Jest** — установка, lint, `tsc`, production build и Jest.
2. **Playwright E2E** — browser scenarios.
3. **Real backend integration/E2E** — Docker services и isolated HTTP scenario.

При failure Playwright `test-results/` содержит trace/screenshots и игнорируется
Git локально; в CI он прикладывается как artifact. Его не нужно коммитить и не
следует чистить пользовательские artefacts широкими delete-командами.

## 5. Минимальный чек-лист после изменения

| Изменение                   | Обязательный минимум                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| Только Markdown             | `npx prettier --check <изменённые .md>`, `git diff --check`                       |
| UI component                | component Jest + lint/typecheck; при критическом flow — browser E2E               |
| Route Handler / `lib` logic | route/unit Jest + lint/typecheck; integration, если изменён реальный контракт     |
| Prisma schema/migration     | `prisma generate`, migration/validate, relevant tests и обновление `db-schema.md` |
| Dependency / deploy config  | полный CI-equivalent, `npm audit --omit=dev`, target environment smoke-test       |

Перед merge смотрите не только на зелёный тест: `git diff --check`, отсутствие
секретов в diff и актуальность [`progress.md`](../progress.md) — такие же части
готовности. Production actions описаны в Oracle/Vercel/Render runbooks.

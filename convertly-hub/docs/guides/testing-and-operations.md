# Тести та операції: як переконатися, що шари працюють разом

## 1. Піраміда перевірок

| Рівень               | Команда                                  | Що перевіряє                                          | Де шукати                         |
| -------------------- | ---------------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Стиль і типи         | `npm run linteslint`, `npx tsc --noEmit` | TypeScript, React/Next rules, imports                 | увесь проєкт                      |
| Unit/component/route | `npm test`                               | isolated business/UI/HTTP contracts                   | `**/__tests__/*.test.*`           |
| Browser E2E          | `npm run test:e2e`                       | критичні публічні user flows у Chromium               | `e2e/critical-flows.spec.ts`      |
| Real integration/E2E | `npm run test:integration`               | реальні PostgreSQL, MinIO, Gotenberg, MailHog і HTTP  | `e2e/backend-integration.spec.ts` |
| API audit            | `npm run audit:api`                      | узгоджені HTTP responses на запущеному сервісі        | `scripts/audit-api.mjs`           |

`npm test` не потребує Docker. `test:integration` створює ізольований Compose
stack і після успіху видаляє його; не спрямовуйте його на локальну робочу БД.
Докладний запуск — [integration-tests.md](../integration-tests.md).

## 2. Як тести пов'язані з кодом

- `components/core/__tests__/FileDropzone.test.tsx` захищає disabled/upload/error/
  success states common dropzone.
- `lib/core/__tests__/conversion*.test.ts` перевіряє допустимі напрями та job
  lifecycle без реального браузера.
- `app/api/**/__tests__/route.test.ts` перевіряють конкретний HTTP contract: status,
  auth, validation і відсутність небезпечних даних у response.
- `components/dashboard/__tests__/ConversionHistory.test.tsx` перевіряє пошук,
  cursor paging, availability и download affordance.
- `e2e/critical-flows.spec.ts` використовує стійкі role/label locators і чекає
  спостережуваний результат, а не `waitForTimeout`.
- `e2e/backend-integration.spec.ts` проходить реальний шлях auth → quota → storage
  → API conversion → admin на окремих сервісах.

Коли змінюється behaviour, змінюється відповідний тест. Наприклад, додавання
password eye зробило `getByLabel('Password')` неоднозначним, оскільки і input, і
button отримали label. Коректний Playwright locator тоді:

```ts
await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Show Password' })).toBeVisible();
```

## 3. Локальний операційний контур

Основний local stack:

```text
Next.js (host :3001)
  ├─ PostgreSQL (Docker :5432)
  ├─ MinIO API (:9000) / Console (:9001)
  ├─ Gotenberg (:3000)
  └─ MailHog SMTP (:1025) / UI (:8025)
```

Команди, порядок `.env`, міграції, health response і першого адміністратора
зафіксовані у [local-start.md](../local-start.md). Не замінюйте основний `.env`
шаблоном цілком: додавайте відсутні keys із `.env.example` та зберігайте
локальні secrets.

Перевірка готового stack:

```bash
npm run audit:api
curl http://localhost:3001/api/health
```

Очікуваний `/api/health` за повністю запущеної інфраструктури:

```json
{
  "status": "healthy",
  "database": "up",
  "storage": "up",
  "gotenberg": "up"
}
```

Якщо один dependency недоступний, це не причина вимикати health check: спочатку
перевірте `docker compose ps`, container logs і відповідну environment
variable. `MailHog` не бере участі в цьому health response, але потрібен для ручної
перевірки verification/reset email.

## 4. CI та артефакти

GitHub Actions запускається на push до будь-якої гілки, коли зачеплено `convertly-hub`.
Jobs розділені, тому failure browser E2E не має забруднювати real integration
containers:

1. **Lint, types and Jest** — встановлення, lint, `tsc`, production build і Jest.
2. **Playwright E2E** — browser scenarios.
3. **Real backend integration/E2E** — Docker services й isolated HTTP scenario.

За failure Playwright `test-results/` містить trace/screenshots і ігнорується
Git локально; у CI він додається як artifact. Його не потрібно комітити й не
слід чистити користувацькі artefacts широкими delete-командами.

`npm audit --omit=dev` навмисно не запущений окремою CI-командою: його виконують
перед dependency/deployment-зміною та зіставляють з
[dependency-security-latest.md](../audits/dependency-security-latest.md). Це
робить результат audit явним рішенням, а не причиною автоматичного
незрозумілого deploy failure.

## 5. Production operations: migration, backup, deploy

Для Northflank + Supabase порядок безпечніший, ніж «спочатку deploy app»:

```text
1. Перевірити GitHub Actions і diff migration.
2. Створити логічний PostgreSQL backup через Supabase CLI.
3. Запустити one-off job convertly-migrate: npx prisma migrate deploy.
4. Переконатися, що завдання завершилося з exit code 0.
5. Зібрати/deploy convertly-app і дочекатися readiness/GET /api/health.
6. Виконати вузький smoke test зміненого користувацького flow.
```

Команди та безпечне зберігання трьох файлів dump описано у
[supabase-logical-backup.md](../supabase-logical-backup.md). Migration job
використовує той самий Dockerfile і `DATABASE_URL`, але окрему secret group; він не
має отримувати SMTP, S3 або Telegram credentials, якщо migration не потребує їх.
Для code-only зміни кроки 2–4 не потрібні: достатньо build/deploy app і health
check. `GET /api/health` перевіряє PostgreSQL, S3 bucket і private Gotenberg;
успішний health не замінює перевірку email або конкретної конвертації.

Під час зміни provider не переносіть Docker volumes «як є». Використовуйте
PostgreSQL dump, S3 object migration, Git revision і заново створені secrets за
[cloud-portability.md](../cloud-portability.md).

## 6. Мінімальний чек-лист після зміни

| Зміна                       | Обов'язковий мінімум                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| Лише Markdown               | `npx prettier --check <змінені .md>`, `git diff --check`                          |
| UI component                | component Jest + lint/typecheck; за критичного flow — browser E2E                 |
| Route Handler / `lib` logic | route/unit Jest + lint/typecheck; integration, якщо змінено реальний контракт     |
| Prisma schema/migration     | `prisma generate`, migration/validate, relevant tests і оновлення `db-schema.md`  |
| Dependency / deploy config  | повний CI-equivalent, `npm audit --omit=dev`, target environment smoke-test       |

Перед merge дивіться не лише на успішний тест: `git diff --check`, відсутність
секретів у diff та актуальність [`progress.md`](../progress.md) — такі самі частини
готовності. Production actions описано в Oracle/Vercel/Render runbooks.

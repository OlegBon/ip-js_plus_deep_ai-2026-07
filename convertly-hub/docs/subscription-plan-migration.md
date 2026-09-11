# Нормалізація тарифів: `Subscription.activePlan`

## Інваріант

Активний тариф користувача зберігається лише у `Subscription.activePlan`.
`User.plan` був legacy-дублікатом і видалений migration
`20260907140000_subscription_plan_source_of_truth`.

У кожного зареєстрованого користувача має існувати рівно одна
`Subscription`: це забезпечують реєстрація та unique foreign key
`Subscription.userId`. `requestedPlan` і `PENDING_DEMO` лишаються лише для
неоплаченої демонстраційної заявки; вони не змінюють активні ліміти, API-доступ
або retention.

## Що робить migration

Migration виконується в одній транзакції PostgreSQL:

1. Знаходить користувачів без `Subscription`.
2. Створює їм `Subscription` із legacy `User.plan` і `ACTIVE`.
3. Якщо Subscription уже є і її `activePlan` розходиться з `User.plan`, не
   змінює її: переможцем лишається `Subscription.activePlan`.
4. Видаляє `User.plan`.

Тому migration застосовується лише вперед. Відкат app image не відкочує
схему; у разі проблеми потрібні окрема forward migration і backup.

## Production-порядок для Northflank + Supabase

1. Створіть логічний backup Supabase поза Git: roles, schema і data SQL dumps.
2. Перезберіть `convertly-migrate` із commit із цією migration, але ще не
   запускайте його стандартний CMD.
3. Запустіть один manual run із run-only Custom command:

   ```text
   node scripts/audit-subscription-plans.mjs
   ```

   Він лише читає БД і виводить три лічильники: `totalUsers`,
   `usersWithoutSubscription`, `legacyPlanMismatches`. Email, тарифи окремих
   користувачів і connection string до логу не виводяться.

4. Збережіть результат audit у operational notes. Ненульові `usersWithoutSubscription`
   і `legacyPlanMismatches` допустимі: migration обробить їх за описаним
   правилом. У разі неочікувано великої кількості зупиніться та перевірте backup.
5. Запустіть той самий актуальний build зі звичайним CMD job:

   ```text
   npx prisma migrate deploy
   ```

   У логах має бути `Applying migration
\`20260907140000_subscription_plan_source_of_truth\`` і exit code `0`.

6. Знову виконайте audit script. Після migration очікуються
   `usersWithoutSubscription: 0`, `legacyPlanColumnPresent: false` и
   `legacyPlanMismatches: null`.
7. Лише після цього перезберіть і задеплойте `convertly-app` із того самого
   commit. Перевірте Free, Basic, Pro, створення API key і browser/API conversion.

## Ручна зміна тестового тарифу

До появи справжнього payment provider використовуйте наявний one-off command
`node scripts/sync-user-plan.mjs` у manual run `convertly-migrate`. Передавайте
лише run-time overrides `PLAN_SYNC_EMAIL` і `PLAN_SYNC_ACTIVE_PLAN`. Скрипт
змінює один запис `Subscription`, очищує `requestedPlan` і встановлює `ACTIVE`.
Він не створює користувача та не записує його email до логу.

Не застосовуйте цей script як платіжний flow: після підключення billing provider
тариф має змінюватися лише з перевіреного webhook.

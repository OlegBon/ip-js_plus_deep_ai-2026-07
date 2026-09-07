# Нормализация тарифов: `Subscription.activePlan`

## Инвариант

Активный тариф пользователя хранится только в `Subscription.activePlan`.
`User.plan` был legacy-дубликатом и удалён migration
`20260907140000_subscription_plan_source_of_truth`.

У каждого зарегистрированного пользователя должна существовать ровно одна
`Subscription`: это обеспечивают регистрация и unique foreign key
`Subscription.userId`. `requestedPlan` и `PENDING_DEMO` остаются только для
неоплаченной демонстрационной заявки; они не меняют активные лимиты, API-доступ
или retention.

## Что делает migration

Migration выполняется в одной транзакции PostgreSQL:

1. Находит пользователей без `Subscription`.
2. Создаёт им `Subscription` с legacy `User.plan` и `ACTIVE`.
3. Если Subscription уже есть и её `activePlan` расходится с `User.plan`, не
   меняет её: победителем остаётся `Subscription.activePlan`.
4. Удаляет `User.plan`.

Поэтому migration применяется только вперёд. Откат app image не откатывает
схему; при проблеме нужна отдельная forward migration и backup.

## Production-порядок для Northflank + Supabase

1. Создайте логический backup Supabase вне Git: roles, schema и data SQL dumps.
2. Пересоберите `convertly-migrate` из commit с этой migration, но ещё не
   запускайте его стандартный CMD.
3. Запустите один manual run с run-only Custom command:

   ```text
   node scripts/audit-subscription-plans.mjs
   ```

   Он только читает БД и печатает три счётчика: `totalUsers`,
   `usersWithoutSubscription`, `legacyPlanMismatches`. Email, планы отдельных
   пользователей и connection string в лог не выводятся.

4. Сохраните результат audit в operational notes. Ненулевые `usersWithoutSubscription`
   и `legacyPlanMismatches` допустимы: migration обработает их по описанному
   правилу. При неожиданно большом числе остановитесь и проверьте backup.
5. Запустите тот же актуальный build с обычным CMD job:

   ```text
   npx prisma migrate deploy
   ```

   В логах должно быть `Applying migration
\`20260907140000_subscription_plan_source_of_truth\``и exit code`0`.

6. Снова выполните audit script. После migration ожидаются
   `usersWithoutSubscription: 0`, `legacyPlanColumnPresent: false` и
   `legacyPlanMismatches: null`.
7. Только после этого пересоберите и задеплойте `convertly-app` из того же
   commit. Проверьте Free, Basic, Pro, создание API key и browser/API conversion.

## Ручная смена тестового тарифа

До настоящего payment provider используйте существующий one-off command
`node scripts/sync-user-plan.mjs` в manual run `convertly-migrate`. Передавайте
только run-time overrides `PLAN_SYNC_EMAIL` и `PLAN_SYNC_ACTIVE_PLAN`. Скрипт
изменяет одну запись `Subscription`, очищает `requestedPlan` и ставит `ACTIVE`.
Он не создаёт пользователя и не пишет его email в лог.

Не применяйте этот script как платёжный flow: после подключения billing provider
тариф обязан меняться только из проверенного webhook.

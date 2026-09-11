# 010 — Billing і платежі

## Статус

Відкладено до вибору платіжного provider і юридичної моделі продажів.

## Що вже є

`Subscription.activePlan` — єдине джерело істини тарифу. Mock Checkout
і one-off `PLAN_SYNC_*` призначені лише для demo/ручної перевірки.

## Наступна реалізація

1. Вибрати provider, країни/валюти, податки та lifecycle підписки.
2. Створити checkout лише на сервері.
3. Перевіряти підписані webhook events і виконувати зміни
   `Subscription.activePlan`, `status`, `requestedPlan` ідемпотентно.
4. Прибрати manual plan sync зі звичайного business-flow, лишити його лише для
   аварійної операційної процедури.
5. Додати payment integration/E2E, обробку скасування, повернень і зміни плану.

Не змінювати тариф на підставі browser redirect без webhook provider.

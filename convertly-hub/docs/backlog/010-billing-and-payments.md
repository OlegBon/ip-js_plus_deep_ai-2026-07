# 010 — Billing и платежи

## Статус

Отложено до выбора платёжного provider и юридической модели продаж.

## Что уже есть

`Subscription.activePlan` — единственный источник истины тарифа. Mock Checkout
и one-off `PLAN_SYNC_*` предназначены только для demo/ручной проверки.

## Следующая реализация

1. Выбрать provider, страны/валюты, налоги и lifecycle подписки.
2. Создать checkout только на сервере.
3. Проверять подписанные webhook events и делать изменения
   `Subscription.activePlan`, `status`, `requestedPlan` идемпотентно.
4. Убрать manual plan sync из обычного business-flow, оставить его только для
   аварийной операционной процедуры.
5. Добавить payment integration/E2E, обработку отмены, возвратов и смены плана.

Не изменять тариф на основании browser redirect без webhook provider.

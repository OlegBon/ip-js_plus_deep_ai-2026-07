# Telegram Bot: налаштування та перевірка

Цей runbook описує публічне оформлення й експлуатацію Convertly Hub Bot.
Token і webhook secret не вставляються в чат, документацію або Git: вони лишаються
server-only secrets групи `convertly-app-runtime`.

## 1. Перед початком

У Northflank мають бути задані `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
без `@` і `TELEGRAM_WEBHOOK_SECRET`, після чого виконано rollout restart.
Webhook веде лише на публічний HTTPS URL:

```text
https://convertly-hub.bon.kharkov.ua/api/telegram/webhook
```

У `setWebhook` використовуйте той самий secret як `secret_token` і лишайте
`allowed_updates` рівним `message`. Внутрішні Northflank, Gotenberg і Supabase
адреси ніколи не є webhook URL.

## 2. Оформлення у BotFather

Відкрийте `@BotFather` → `/mybots` → Convertly Hub Bot → **Edit Bot**.

1. Встановіть профільний image через **Edit Botpic**.
2. У **Edit Description** вставте:

   ```text
   Securely link Telegram to Convertly Hub and receive password reset links.
   ```

3. У **Edit About** вставте:

   ```text
   Secure Telegram linking and password recovery for Convertly Hub.
   ```

4. У **Edit Commands** задайте:

   ```text
   start - Start or complete account linking
   help - Learn how Telegram linking works
   ```

Не додавайте команди reset, email, files, API keys або account management:
бот навмисно не приймає чутливі дані.

## 3. Перевірка після deploy

У private chat перевірте `/start`, `/help`, довільне повідомлення й Telegram
deep link із Dashboard. Бот має надавати welcome/help, нейтрально відповідати на
невідомий текст і підтверджувати успіх або спливле/вже використане посилання
без даних іншого облікового запису. Після прив'язки перевірте password reset за
`@username`, потім Disconnect Telegram: HTTP-відповідь reset лишається нейтральною,
але посилання до бота більше не надходить.

Перевірте `getWebhookInfo`: URL має бути final HTTPS endpoint, а
`pending_update_count` і `last_error_*` не мають повідомляти про проблеми доставки.

## 4. Експлуатація

- Залиште Privacy Mode для груп увімкненим; не додавайте бота адміністратором
  груп і не вмикайте inline mode без окремої продуктової задачі.
- Не логуйте повний Telegram update, chat ID, deep-link token або reset URL.
- У разі підозри на розкриття token перевипустіть його в BotFather, оновіть
  Northflank secret і повторно задайте webhook.
- Особистий Telegram account підходить для поточного manual smoke-test. Окремий
  test bot потрібен, коли основним ботом користуються реальні користувачі або потрібно
  ізольовано перевірити ризиковані зміни.

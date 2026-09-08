# Telegram Bot: настройка и проверка

Этот runbook описывает публичное оформление и эксплуатацию Convertly Hub Bot.
Token и webhook secret не вставляются в чат, документацию или Git: они остаются
server-only secrets группы `convertly-app-runtime`.

## 1. Перед началом

В Northflank должны быть заданы `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
без `@` и `TELEGRAM_WEBHOOK_SECRET`, после чего выполнен rollout restart.
Webhook ведёт только на публичный HTTPS URL:

```text
https://convertly-hub.bon.kharkov.ua/api/telegram/webhook
```

В `setWebhook` используйте тот же secret как `secret_token` и оставьте
`allowed_updates` равным `message`. Внутренние Northflank, Gotenberg и Supabase
адреса никогда не являются webhook URL.

## 2. Оформление в BotFather

Откройте `@BotFather` → `/mybots` → Convertly Hub Bot → **Edit Bot**.

1. Установите профильный image через **Edit Botpic**.
2. В **Edit Description** вставьте:

   ```text
   Securely link Telegram to Convertly Hub and receive password reset links.
   ```

3. В **Edit About** вставьте:

   ```text
   Secure Telegram linking and password recovery for Convertly Hub.
   ```

4. В **Edit Commands** задайте:

   ```text
   start - Start or complete account linking
   help - Learn how Telegram linking works
   ```

Не добавляйте команды reset, email, files, API keys или account management:
бот намеренно не принимает чувствительные данные.

## 3. Проверка после deploy

В private chat проверьте `/start`, `/help`, произвольное сообщение и Telegram
deep link из Dashboard. Бот должен давать welcome/help, нейтрально отвечать на
неизвестный текст и подтверждать успех либо истёкшую/уже использованную ссылку
без данных другого аккаунта. После привязки проверьте password reset по
`@username`, затем Disconnect Telegram: HTTP-ответ reset остаётся нейтральным,
но ссылка в бот больше не приходит.

Проверьте `getWebhookInfo`: URL должен быть final HTTPS endpoint, а
`pending_update_count` и `last_error_*` не должны сообщать о проблемах доставки.

## 4. Эксплуатация

- Оставьте Privacy Mode для групп включённым; не добавляйте бота администратором
  групп и не включайте inline mode без отдельной продуктовой задачи.
- Не логируйте полный Telegram update, chat ID, deep-link token или reset URL.
- При подозрении на раскрытие token перевыпустите его в BotFather, обновите
  Northflank secret и повторно задайте webhook.
- Личный Telegram account подходит для текущего manual smoke-test. Отдельный
  test bot нужен, когда основной бот используют реальные пользователи или нужно
  изолированно проверить рискованные изменения.

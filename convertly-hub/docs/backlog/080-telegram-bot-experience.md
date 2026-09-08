# 080 — UX и операционное оформление Telegram-бота

## Проблема

Бот уже выполняет защищённую техническую роль: подтверждает deep link и
доставляет password-reset URL. Но `/start` без параметра и обычные сообщения
не дают пользователю понятного ответа; у бота также нет оформленного
description, about text и списка команд.

## Принцип

Convertly Hub Bot — минимальный security assistant, а не второй интерфейс
SaaS. Он помогает подключить Telegram и получить ссылку восстановления, но не
принимает файлы, пароли, email, API keys или команды управления аккаунтом.

## Сценарии сообщений

### `/start` без параметра

Отправить короткое welcome-сообщение:

> Welcome to Convertly Hub. Use a secure one-time link from My Account to
> connect Telegram. After linking, you can request a password reset through
> your linked @username. For your privacy, this bot does not accept files,
> passwords or account details.

Добавить только URL-кнопки, не требующие `callback_query`:

- **Open Convertly Hub** → публичный origin приложения;
- **How to connect** → безопасная документация или соответствующий account
  screen.

### `/start link_<token>`

- успех: `Telegram is connected to your Convertly Hub account. You can return
  to the app.`;
- token expired/invalid/already used: `This link has expired or was already
  used. Create a new link in My Account.`;
- unique conflict: нейтральный текст без раскрытия того, кому принадлежит chat
  или username.

### `/help` и неизвестное сообщение

`/help` кратко объясняет: войти в Convertly Hub → My Account → Connect
Telegram → открыть одноразовую ссылку. Неизвестное сообщение получает такой
же нейтральный ответ и ссылку на сайт. Бот не инициирует reset по сообщению с
email или username.

## Настройка через BotFather

После реализации обработчиков задать:

- `/setdescription`:
  `Securely link Telegram to Convertly Hub and receive password reset links.`
- `/setabouttext`:
  `Secure Telegram linking and password recovery for Convertly Hub.`
- `/setcommands`:

  ```text
  start - Start or complete account linking
  help - Learn how Telegram linking works
  ```

- актуальный профильный image и публичную ссылку/описание без персональных
  данных и секретов.

Privacy Mode для групп оставить включённым. Бота не нужно делать администратором
групп и не нужно включать inline mode или принимать update types, которые
продукту не требуются. В `setWebhook` оставить allowlist `message` и secret
token.

## Операционная политика

- `TELEGRAM_BOT_TOKEN` и webhook secret хранятся только как server-only secrets;
  при подозрении на раскрытие token немедленно перевыпускается в BotFather и
  обновляется в Northflank.
- Периодически проверять `getWebhookInfo`: URL, `pending_update_count` и
  `last_error_*`.
- Не логировать полный update, reset URL, deep-link token или chat ID.
- Личный Telegram-аккаунт подходит для текущего manual test. Отдельный test
  bot становится полезен, когда основной бот начнут использовать реальные
  пользователи или потребуется безопасно проверять несовместимые изменения.

## Тесты и проверка

- Jest: `/start`, `/start link_<token>` success/failure, `/help`, unknown
  message, outbound Bot API payload и timeout/error handling.
- Проверить, что inline-кнопки содержат только allowlisted HTTPS URLs и не
  несут token либо account data.
- Manual: чистый private chat, уже связанный чат, истёкший link, новый аккаунт
  без username и отсутствие полезных ответов на ввод чувствительных данных.
- Проверить команды и description в Telegram-клиенте после BotFather setup.

## Критерии готовности

- Новый пользователь понимает назначение бота без обращения в поддержку.
- Бот выдаёт ровно минимальный объём информации, необходимый для linking и
  recovery.
- Никакой командой или сообщением нельзя передать/получить секреты, файлы или
  данные аккаунта.

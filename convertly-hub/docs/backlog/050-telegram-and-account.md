# 050 — Telegram и дальнейшие account flows

## Статус

Код Telegram password recovery подготовлен migration
`20260907170000_telegram_password_recovery`; задача будет завершена после
production migration, app deploy, настройки webhook и ручного smoke-test. В MVP есть безопасная **привязка Telegram**: авторизованный пользователь
получает одноразовый deep link, открывает бота и отправляет `/start link_<token>`.
Webhook проверяет отдельный secret header, привязывает `telegramId` (chat ID)
однократно и сохраняет время подтверждения. Этот механизм не является
восстановлением пароля: сейчас reset доступен только через email.

## Реализованный recovery flow

Telegram password recovery доступен только для аккаунта с уже подтверждённой
привязкой. Пользователь начинает recovery обычной формой, получает нейтральный
ответ независимо от существования аккаунта, а бот отправляет одноразовую
ссылку в **уже подтверждённый chat**. Ссылка использует текущую модель
одноразовых hashed reset-токенов и TTL; пароль не передаётся Telegram-боту.

`@username` — только удобное отображаемое имя: он может отсутствовать и
меняться. Доказательством владения остаётся сохранённый подтверждённый chat ID,
а не username, введённый в форме.

## Что подготовить в Telegram

1. В `@BotFather` создать отдельного бота Convertly Hub или подтвердить, что
   уже созданный бот предназначен для production. Сохранить username бота,
   например `convertly_hub_bot`; он публичен и используется в deep link.
2. Скопировать bot token. Это секрет уровня пароля: хранить только в password
   manager и в Northflank secret group, никогда не присылать в чат, не коммитить
   и не добавлять в скриншоты.
3. Создать отдельный случайный webhook secret (длинная случайная строка).
   Он отличается от bot token и проверяется в заголовке Telegram webhook.
4. Убедиться, что production domain имеет рабочий HTTPS:
   `https://convertly-hub.bon.kharkov.ua`. Telegram должен иметь возможность
   выполнить HTTPS request к `/api/telegram/webhook`.
5. После реализации вызвать Bot API `setWebhook` с URL
   `https://convertly-hub.bon.kharkov.ua/api/telegram/webhook` и
   `secret_token=<TELEGRAM_WEBHOOK_SECRET>`. Проверить `getWebhookInfo`:
   URL должен совпадать, `last_error_message` — отсутствовать.
6. Написать боту `/start` с тестового Telegram account и привязать его из
   Dashboard. Privacy Mode можно оставить включённым: для команды `/start`
   в личном чате это не препятствие. Не просите у пользователей пароль,
   email или API key в Telegram.

### Переменные окружения

| Переменная                | Где хранить                                 | Назначение                         |
| ------------------------- | ------------------------------------------- | ---------------------------------- |
| `TELEGRAM_BOT_TOKEN`      | Только `convertly-app-runtime` secret group | Вызов Bot API и настройка webhook. |
| `TELEGRAM_BOT_USERNAME`   | `convertly-app-runtime`; не секрет          | Deep link к боту без `@`.          |
| `TELEGRAM_WEBHOOK_SECRET` | Только `convertly-app-runtime` secret group | Проверка webhook header.           |

Не добавляйте эти значения в `convertly-migrate`: migration job не работает с
Telegram и не должен получать лишние secrets.

## Критерии готовности

- неподтверждённый Telegram не даёт recovery;
- recovery не раскрывает, существует ли email, username или Telegram chat;
- ссылка одноразовая, имеет TTL и работает только для конкретного user;
- неверный webhook secret не изменяет БД;
- токен/ссылка/password/chat ID не попадают в логи;
- email recovery продолжает работать независимо от Telegram.

## Account deletion

Основной workflow уже реализован: request, review/cancel/process в Admin,
удаление private S3 objects и каскадных данных, audit trail и SMTP
notification. Будущие изменения требуют отдельного review retention policy,
правовых сроков и восстановления при частичном Storage failure.

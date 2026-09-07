# 050 — Telegram и дальнейшие account flows

## Статус

Реализация и production-инфраструктура подготовлены 7 сентября 2026:

- [x] migration `20260907170000_telegram_password_recovery` применена;
- [x] `convertly-app` развёрнут с Telegram server-only variables;
- [x] Bot API webhook настроен на
      `https://convertly-hub.bon.kharkov.ua/api/telegram/webhook` и отвечает без
      ошибок;
- [x] Telegram-аккаунт успешно привязан из Dashboard; username сохранён;
- [ ] вручную проверить recovery: выйти из аккаунта, запросить reset через
      `@username`, получить от бота одноразовую ссылку и успешно задать новый
      пароль.

После последнего пункта файл удаляется из активного backlog согласно
[правилам папки](./README.md): реализация останется в Git, `progress.md` и
тематической документации. В MVP есть безопасная **привязка Telegram**:
авторизованный пользователь получает одноразовый deep link, открывает бота и
отправляет `/start link_<token>`.
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

## Production-конфигурация и проверка

1. Bot `@convertly_hub_bot`, token и независимый webhook secret хранятся в
   password manager; секреты не попадают в Git, чат или скриншоты.
2. Production domain использует HTTPS:
   `https://convertly-hub.bon.kharkov.ua`.
3. Вызов Bot API `setWebhook` выполнен с URL
   `https://convertly-hub.bon.kharkov.ua/api/telegram/webhook` и
   `secret_token=<TELEGRAM_WEBHOOK_SECRET>`.
4. `getWebhookInfo` возвращает этот URL без `last_error_message`.
5. Пользователь привязывает аккаунт через Dashboard → **Connect Telegram** →
   кнопку **Start** в открывшемся private chat. Privacy Mode можно оставить
   включённым. Не просите у пользователей пароль, email или API key в Telegram.

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
- ручной recovery по `@username` доставляет ссылку именно в уже привязанный
  private chat, а новая парольная пара даёт успешный вход.

## Account deletion

Основной workflow уже реализован: request, review/cancel/process в Admin,
удаление private S3 objects и каскадных данных, audit trail и SMTP
notification. Будущие изменения требуют отдельного review retention policy,
правовых сроков и восстановления при частичном Storage failure.

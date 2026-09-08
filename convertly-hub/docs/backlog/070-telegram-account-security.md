# 070 — Управление Telegram-привязкой и безопасность recovery

## Проблема

Telegram уже используется как дополнительный канал восстановления пароля, но
пользователь пока не может сам отвязать аккаунт. При этом начало replacement
link преждевременно сбрасывает `telegramVerified`: если новый deep link не
будет подтверждён, прежний канал recovery перестаёт работать. Webhook также
должен явно принимать привязку только из private chat, чтобы адресом доставки
reset-сообщения никогда не стал групповой чат.

## Цель

Сделать Telegram управляемым, добровольным и безопасным дополнительным
каналом recovery. Основным способом входа и восстановления остаётся email.

## Предлагаемый пользовательский сценарий

### Dashboard и Edit Profile

- У подключённого аккаунта показать `Connected as @username · Verified`.
- Оставить **Change Telegram account** для замены привязки.
- Добавить менее заметное destructive-действие **Disconnect Telegram**.
- Перед отвязкой открыть модалку: «Вы больше не сможете получать ссылки
  восстановления через Telegram; email recovery останется доступным».
- После успеха сразу обновить профиль на странице и показать success toast.
- Если Telegram не подключён, показать только действие подключения.

### Серверное правило

`DELETE /api/account/telegram/link` доступен только для текущей активной
сессии и идемпотентно очищает:

- `telegramId`;
- `telegramUsername`;
- `telegramVerified`;
- незавершённые `telegramVerificationTokenHash` и
  `telegramVerificationExpires`.

Сервер не принимает user ID из browser body и не отключает Telegram другого
аккаунта. В первой версии подтверждения из уже авторизованной сессии и явной
destructive-модалки достаточно; отдельный запрос пароля не нужен.

## Обязательные security-правила

1. Webhook обрабатывает linking token только когда `message.chat.type` равен
   `private`. Group/channel updates отвечают нейтральным `200`, но не меняют
   пользователя.
2. При создании нового deep link прежняя подтверждённая привязка остаётся
   действующей, пока новый token не будет успешно подтверждён. Новый token
   заменяет только предыдущий pending token.
3. При успешном подтверждении Telegram `chat.id` — каноническая привязка.
   `@username` является только display/recovery selector: он может отсутствовать
   или меняться пользователем Telegram.
4. Токены link одноразовые, хранятся только в hash-виде, имеют TTL и
   инвалидируются при unlink.
5. Webhook продолжает проверять
   `X-Telegram-Bot-Api-Secret-Token`; содержимое update, reset URL и токены не
   пишутся в логи.
6. Нельзя автоматически переносить привязку между двумя Convertly-аккаунтами.
   При unique conflict пользователь получает нейтральную ошибку и обращается
   в support.

## Тесты и проверка

- Jest: private-chat linking happy path; group/channel update не меняет БД;
  invalid/expired/reused token; unique conflict; unlink happy path,
  unauthorized и повторный unlink.
- Jest: opening replacement link сохраняет ранее подтверждённые поля до
  нового подтверждения.
- Component tests: pending/disabled state, confirm modal, cancellation,
  toast и обновление connected/disconnected view.
- Playwright/manual: connect → recovery through `@username` → disconnect →
  Telegram recovery становится нейтрально недоступным → relink.
- Northflank smoke-test: проверить `getWebhookInfo`, private-chat linking и
  отсутствие секретов в browser/service logs.

## Критерии готовности

- Пользователь может отключить и снова подключить Telegram без участия
  администратора.
- Неподтверждённая замена не ломает предыдущий recovery channel.
- Привязка из группы технически невозможна.
- После unlink reset-ссылка не уходит в ранее связанный Telegram chat.

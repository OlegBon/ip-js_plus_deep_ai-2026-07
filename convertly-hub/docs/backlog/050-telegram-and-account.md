# 050 — Telegram и дальнейшие account flows

## Telegram password recovery

После подтверждённой привязки хранить публичный username, отправлять
одноразовую ссылку через Bot API в подтверждённый chat и покрыть flow
rate-limit/integration-тестами. Не считать username доказательством владения
аккаунтом без подтверждённого `telegramId`.

## Account deletion

Основной workflow уже реализован: request, review/cancel/process в Admin,
удаление private S3 objects и каскадных данных, audit trail и SMTP
notification. Будущие изменения требуют отдельного review retention policy,
правовых сроков и восстановления при частичном Storage failure.

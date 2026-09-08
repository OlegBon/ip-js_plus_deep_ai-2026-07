# Backlog

Эта папка — единственный рабочий backlog будущих изменений. Каждый файл
посвящён одной теме и использует имя `<номер>-<тема>.md`; номер задаёт порядок
обсуждения, а не обещание срока.

Завершённые задачи не перемещаются в `done/`: это создало бы второй, быстро
устаревающий журнал рядом с Git и `docs/progress.md`. После реализации задача
удаляется из активного backlog, а решение фиксируется в `progress.md`,
тематической документации и merge-коммите. Если когда-либо понадобится
развернутый product decision record, его лучше создавать в `docs/decisions/`,
а не хранить старые backlog-копии.

| Файл                                                                     | Тема                                                      |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| [010-billing-and-payments.md](./010-billing-and-payments.md)             | Реальная оплата и billing webhook.                        |
| [020-conversion-capabilities.md](./020-conversion-capabilities.md)       | PDF → DOCX и диагностика проблемных конвертаций.          |
| [030-security-and-scale.md](./030-security-and-scale.md)                 | Redis rate limit, поиск и рост базы.                      |
| [040-operations-and-reliability.md](./040-operations-and-reliability.md) | Backup, monitoring, production hardening и portability.   |
| [060-admin-conversion-history.md](./060-admin-conversion-history.md)     | Операционная история конвертаций и обработка failed jobs. |

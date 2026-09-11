# Backlog

Ця папка — єдиний робочий backlog майбутніх змін. Кожен файл
присвячено одній темі та використовує назву `<номер>-<тема>.md`; номер задає порядок
обговорення, а не обіцянку терміну.

Завершені задачі не переміщуються до `done/`: це створило б другий журнал, що швидко
застаріває, поруч із Git і `docs/progress.md`. Після реалізації задача
видаляється з активного backlog, а рішення фіксується у `progress.md`,
тематичній документації та merge-коміті. Якщо колись знадобиться
розгорнутий product decision record, його краще створювати у `docs/decisions/`,
а не зберігати старі backlog-копії.

| Файл                                                                     | Тема                                                      |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| [010-billing-and-payments.md](./010-billing-and-payments.md)             | Реальна оплата та billing webhook.                        |
| [020-conversion-capabilities.md](./020-conversion-capabilities.md)       | PDF → DOCX і діагностика проблемних конвертацій.          |
| [030-security-and-scale.md](./030-security-and-scale.md)                 | Redis rate limit, пошук і зростання бази.                 |
| [040-operations-and-reliability.md](./040-operations-and-reliability.md) | Backup, monitoring, production hardening і portability.   |
| [060-admin-conversion-history.md](./060-admin-conversion-history.md)     | Операційна історія конвертацій і обробка failed jobs.     |

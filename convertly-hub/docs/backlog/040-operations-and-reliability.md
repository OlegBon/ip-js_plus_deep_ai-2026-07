# 040 — Operations, надёжность и переносимость

## До полноценного production

- регулярный off-host PostgreSQL и S3 backup с тестовым restore;
- monitoring и alerting для `/api/health`, SMTP и conversion failures;
- policy хранения/удаления объектов и оценка egress;
- CD с отдельным контролируемым migration шагом;
- подтверждённый capacity/стоимость выбранного provider.

## Cloud portability

Канонический порядок переноса хранится в
[cloud-portability.md](../cloud-portability.md). Перед сменой provider его
нужно повторно сверить с ограничениями конкретной платформы, а не копировать
секреты и DNS «как есть».

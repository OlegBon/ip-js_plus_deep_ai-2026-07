# 040 — Operations, надійність і переносимість

## До повноцінного production

- регулярний off-host PostgreSQL і S3 backup із тестовим restore;
- monitoring і alerting для `/api/health`, SMTP і conversion failures;
- policy зберігання/видалення об'єктів та оцінка egress;
- CD з окремим контрольованим migration кроком;
- підтверджені capacity/вартість вибраного provider.

## Cloud portability

Канонічний порядок перенесення зберігається у
[cloud-portability.md](../cloud-portability.md). Перед зміною provider його
потрібно повторно зіставити з обмеженнями конкретної платформи, а не копіювати
секрети та DNS «як є».

# Логічний backup Supabase PostgreSQL

На Free-плані Supabase не можна покладатися на managed backups. Перед кожною
production Prisma migration і перед перенесенням між providers створюйте
логічний PostgreSQL backup поза репозиторієм. SQL-dump не замінює backup
private S3 bucket: об'єкти Storage експортуються окремим кроком.

## Що знадобиться

- Docker Desktop запущений: Supabase CLI використовує образ PostgreSQL для dump.
- Node.js і доступ до проєкту Supabase.
- Вільна захищена папка поза Git, наприклад `D:\Backups\convertly-hub`.
- Project ref — 20 малих символів із Supabase Dashboard URL/Project Settings,
  а не відображувана назва проєкту.

Не зберігайте у цій папці dump в OneDrive без додаткового шифрування та не
комітьте файли `*.sql`: вони можуть містити персональні дані, хеші,
службові токени й історію конвертацій.

## Перший запуск CLI

```powershell
mkdir D:\Backups\convertly-hub
Set-Location D:\Backups\convertly-hub

npx.cmd supabase@latest init
npx.cmd supabase@latest login
npx.cmd supabase@latest link --project-ref <project-ref>
```

Команда `init` створює локальний `supabase/config.toml`. Виконуйте її один раз
у вибраній backup-папці. Повторний `init` не потрібен і не потребує `--force`.

## Створення узгодженого набору dump

Перед dump зупиніть ручні небезпечні операції: migrations, one-off jobs,
видалення облікових записів і зміну тарифів. Коротка пауза звичайного трафіку для
demo бажана, але CLI виконує штатний logical dump.

```powershell
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "D:\Backups\convertly-hub\$stamp"
New-Item -ItemType Directory -Path $backupDir | Out-Null
Set-Location $backupDir

npx.cmd supabase@latest db dump --linked --role-only -f roles.sql
npx.cmd supabase@latest db dump --linked -f schema.sql
npx.cmd supabase@latest db dump --linked --data-only --use-copy -f data.sql
```

Перевірте, що всі три файли створені та не порожні:

```powershell
Get-ChildItem $backupDir | Select-Object Name, Length, LastWriteTime
```

Зафіксуйте поруч текстовий `README.txt` із датою, project ref, hash поточного
Git commit (`git -C <шлях-до-репозиторію> rev-parse HEAD`) і причиною backup.
Не додавайте туди connection string або секрети.

## Відновлення та перенесення

Відновлення спочатку перевіряють на порожній окремій PostgreSQL-базі, не на
живому production. Порядок: `roles.sql` → `schema.sql` → `data.sql`; точна
команда залежить від вибраного нового PostgreSQL provider і його облікового запису.
Після restore застосуйте `npx prisma migrate deploy` із поточного Git commit і
зіставте `npx prisma migrate status`.

Для повного перенесення даних окремо експортуйте private bucket
`convertly-files` через S3-compatible tooling і зіставте кількість/розмір об'єктів
з таблицею `ConversionLog`. Докладний порядок, перемикання DNS і rollback
описано в [cloud-portability.md](./cloud-portability.md).

## Мінімальний графік

- до кожної migration і масової destructive operation;
- перед зміною provider;
- регулярно за графіком, що відповідає допустимій втраті даних;
- із періодичною перевіркою restore, а не лише факту створення SQL-файлів.

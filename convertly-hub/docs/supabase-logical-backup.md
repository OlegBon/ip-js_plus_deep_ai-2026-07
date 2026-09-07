# Логический backup Supabase PostgreSQL

На Free-плане Supabase нельзя полагаться на managed backups. Перед каждой
production Prisma migration и перед переносом между providers создавайте
логический PostgreSQL backup вне репозитория. SQL-dump не заменяет backup
private S3 bucket: объекты Storage экспортируются отдельным шагом.

## Что потребуется

- Docker Desktop запущен: Supabase CLI использует образ PostgreSQL для dump.
- Node.js и доступ к проекту Supabase.
- Свободная защищённая папка вне Git, например `D:\Backups\convertly-hub`.
- Project ref — 20 строчных символов из Supabase Dashboard URL/Project Settings,
  а не отображаемое имя проекта.

Не храните в этой папке dump в OneDrive без дополнительного шифрования и не
коммитьте файлы `*.sql`: они могут содержать персональные данные, хеши,
служебные токены и историю конвертаций.

## Первый запуск CLI

```powershell
mkdir D:\Backups\convertly-hub
Set-Location D:\Backups\convertly-hub

npx.cmd supabase@latest init
npx.cmd supabase@latest login
npx.cmd supabase@latest link --project-ref <project-ref>
```

Команда `init` создаёт локальный `supabase/config.toml`. Выполняйте её один раз
в выбранной backup-папке. Повторный `init` не нужен и не требует `--force`.

## Создание согласованного набора dump

Перед dump остановите ручные опасные операции: migrations, one-off jobs,
удаления аккаунтов и изменение тарифов. Короткая пауза обычного трафика для
demo желательна, но CLI выполняет штатный logical dump.

```powershell
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "D:\Backups\convertly-hub\$stamp"
New-Item -ItemType Directory -Path $backupDir | Out-Null
Set-Location $backupDir

npx.cmd supabase@latest db dump --linked --role-only -f roles.sql
npx.cmd supabase@latest db dump --linked -f schema.sql
npx.cmd supabase@latest db dump --linked --data-only --use-copy -f data.sql
```

Проверьте, что все три файла созданы и не пусты:

```powershell
Get-ChildItem $backupDir | Select-Object Name, Length, LastWriteTime
```

Зафиксируйте рядом текстовый `README.txt` с датой, project ref, hash текущего
Git commit (`git -C <путь-к-репозиторию> rev-parse HEAD`) и причиной backup.
Не включайте туда connection string или секреты.

## Восстановление и перенос

Восстановление сначала проверяют на пустой отдельной PostgreSQL-базе, не на
живом production. Порядок: `roles.sql` → `schema.sql` → `data.sql`; точная
команда зависит от выбранного нового PostgreSQL provider и его учётной записи.
После restore примените `npx prisma migrate deploy` из текущего Git commit и
сверьте `npx prisma migrate status`.

Для полного переноса данных отдельно экспортируйте private bucket
`convertly-files` через S3-compatible tooling и сверяйте число/размер объектов
с таблицей `ConversionLog`. Детальный порядок, переключение DNS и rollback
описаны в [cloud-portability.md](./cloud-portability.md).

## Минимальный график

- до каждой migration и массовой destructive operation;
- перед сменой provider;
- регулярно по расписанию, которое соответствует допустимой потере данных;
- с периодической проверкой restore, а не только факта создания SQL-файлов.

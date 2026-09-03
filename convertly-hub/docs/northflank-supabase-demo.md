# Demo MVP на Northflank Free + Supabase Free

Этот runbook развёртывает **функциональный публичный demo MVP**, а не production:
Next.js, регистрация, реальный SMTP, `JPG ↔ PNG`, `DOCX → PDF`, Dashboard,
API-ключи, private storage и Admin Panel работают. Он не создаёт аккаунты,
секреты, DNS-записи или ресурсы сам по себе.

Практические действия в панелях — от регистрации до обновления приложения после
`git push` — находятся в отдельном
[пошаговом setup guide](./northflank-supabase-setup.md). Этот документ оставляет
за собой схему, решения и эксплуатационные границы.

> На 2 сентября 2026 Northflank Developer Sandbox допускает 2 services, 2 jobs и
> 1 addon, но сам провайдер указывает, что free tier нельзя использовать для
> production applications. Supabase Free даёт 500 MB PostgreSQL и 1 GB Storage, а
> при низкой активности может приостановить project после 7 дней. Поэтому это
> демонстрационный контур с реальными функциями, но без SLA, production backup и
> обещания постоянной доступности.

Основной production-план остаётся
[Oracle Cloud Free Tier](./oracle-production-deployment.md). Платные альтернативы
описаны в [Vercel](./vercel-production-deployment.md) и
[Render](./render-production-deployment.md).

## 1. Итоговая схема: не объединяем процессы

```text
Internet
  └─ https://convertly-hub.bon.kharkov.ua
       └─ Northflank service `convertly-app` (Next.js, public :3001)
            ├─ Northflank service `convertly-gotenberg` (private :3000)
            ├─ Supabase PostgreSQL (private credentials from app only)
            ├─ Supabase Storage private bucket via S3 API
            └─ uh.ua SMTP: support@bon.kharkov.ua
```

Почему именно так:

- обе Northflank services заняты ровно по назначению free tier: app и Gotenberg;
- PostgreSQL и S3 Storage живут в одном Supabase project — MinIO не нужен;
- Gotenberg не имеет public port и недоступен внешнему клиенту;
- Next.js продолжает использовать привычный `lib/storage/s3.ts`; он работает с
  Supabase S3-compatible endpoint через AWS SDK v3;
- не нужен контейнер с `supervisord`, в котором Gotenberg и MinIO делят память,
  restart и health state.

Не заменяйте эту схему вариантом `Gotenberg + MinIO` в одном container, пока не
нужен отдельный учебный эксперимент. У него общая точка отказа, требуется
persistent volume и дополнительный процесс-supervisor, тогда как этот demo уже
укладывается в два services без этих рисков.

## 2. Что подготовлено в репозитории

- [`Dockerfile`](../Dockerfile) имеет standalone target `runner` для Next.js и
  самостоятельный target `migration` с Prisma CLI.
- `S3_REGION` — server-only переменная. Значение по умолчанию `us-east-1`
  сохраняет локальный MinIO и Oracle без изменений; для Supabase задаётся регион
  конкретного Supabase project.
- [`lib/storage/s3.ts`](../lib/storage/s3.ts) использует endpoint, region,
  access key, secret key и bucket из environment, с `forcePathStyle: true`.
- `.env.example` и `.env.production.example` содержат безопасное имя
  `S3_REGION`, но не значения cloud credentials.

В этом этапе не добавляется `northflank.yaml`: Northflank build configuration
содержит секреты и выбранный compute plan в панели. Фиктивный manifest в Git мог
бы создать ложное впечатление, что он применён, или не совпасть с актуальной
схемой провайдера. Важные, воспроизводимые поля перечислены ниже.

## 3. Preflight до создания сервисов

1. GitHub Actions на целевом commit `main` должны быть зелёными.
2. Локально выполните `npm audit --omit=dev`; не применяйте
   `npm audit fix --force`.
3. Подготовьте только значения для безопасного ввода в панели, не в Git:
   - новый `NEXTAUTH_SECRET` (`openssl rand -base64 48`);
   - SMTP host/port/TLS/password ящика `support@bon.kharkov.ua`;
   - Supabase database URI и S3 access key/secret;
   - точный Supabase region и project ref;
   - domain `convertly-hub.bon.kharkov.ua`.
4. Не используйте локальный `.env` как cloud template: в нём localhost адреса и
   другие секреты. В Northflank/Supabase вводятся новые значения.

## 4. Supabase: один project для PostgreSQL и Storage

### 4.1. Создать проект

1. Создайте один Supabase Free project в европейском регионе, ближайшем к
   Northflank project. Запишите **точное** отображаемое имя региона — оно станет
   `S3_REGION`; не подставляйте регион «на глаз».
2. Скопируйте database connection string для server-side Prisma. Сначала
   используйте direct connection; если выбранный network path требует pooler,
   проверьте Prisma adapter `pg` в smoke-test до переключения DNS.
3. Не включайте Supabase Auth в приложении: Convertly Hub использует собственные
   NextAuth, `User` table и bcrypt. Не подключайте Supabase client в browser.

### 4.2. Создать private S3 bucket

1. В Storage включите **S3 protocol** и создайте private bucket
   `convertly-files` вручную.
2. В Storage S3 Configuration создайте отдельную server-only access key pair.
   Secret покажется один раз; сохраните его только в Northflank secret group.
3. Скопируйте endpoint в форме:

   ```text
   https://<project-ref>.storage.supabase.co/storage/v1/s3
   ```

4. Bucket не должен быть public. RLS здесь не заменяет код приложения: server
   credential имеет широкие S3-права, поэтому owner checks в download Route
   Handlers остаются обязательными.

`HeadBucket`, upload, download и delete, используемые текущим AWS SDK layer,
поддерживаются Supabase S3 API. Object lifecycle rules через S3 endpoint не
считаются настроенными этим runbook; истёкший `expiresAt` уже запрещает download
в приложении, но автоматическое физическое удаление результатов — отдельная
будущая задача. Для demo контролируйте малый объём Storage вручную.

## 5. Northflank: проект и сервисы

Создайте **один** Northflank project в максимально близком EU region. Private
networking действует только внутри одного project, поэтому app и Gotenberg нельзя
разнести по разным projects.

### 5.1. Public app service `convertly-app`

Создайте **Combined Service** из GitHub repository и ветки `main`.

Критичные Build Options для монорепозитория с несколькими домашними проектами:

```text
Build type:       Dockerfile
Dockerfile path:  /convertly-hub/Dockerfile
Build context:    /convertly-hub
Target stage:     runner
```

Northflank по умолчанию клонирует repository, но build context ограничивает
`COPY .` именно подпапкой `convertly-hub`. Поэтому Docker image не получает
соседние проекты. После первого build откройте logs: рабочий directory и пути
`package.json`, `prisma` должны относиться к `convertly-hub`, а не к родительскому
каталогу.

Runtime settings:

```text
Port:       3001 / HTTP / Public
Command:    оставить Dockerfile CMD
Health:     HTTP GET /api/health on port 3001
Instances:  1
```

Не добавляйте Caddy: Northflank сам завершает TLS для public port и custom domain.
Не публикуйте PostgreSQL, Supabase S3 credentials или Gotenberg port.

### 5.2. Private Gotenberg service `convertly-gotenberg`

Создайте второй service из image `gotenberg/gotenberg:8`.

```text
Port:       3000 / HTTP / Private only
Public DNS: disabled
Health:     HTTP GET /health on port 3000
Instances:  1
```

В app secret group обязательно укажите:

```dotenv
GOTENBERG_URL=http://convertly-gotenberg:3000
```

Формат `<service-name>:<private-port>` использует Northflank internal DNS. Имя
должно совпасть с фактическим service name из панели. До запуска проверьте, что у
Gotenberg нет public domain/port: открытый Gotenberg стал бы незащищённой точкой
конвертации для любого посетителя.

## 6. Секреты и configuration groups

Создайте два **runtime secret groups**. Не привязывайте ни один к Gotenberg:

- `convertly-app-runtime` — только к service `convertly-app`;
- `convertly-migration-runtime` — только к migration/seed jobs.

| Переменная                             | Откуда           | Примечание                                                                                     |
| -------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `NODE_ENV`                             | вручную          | `production`; нужен обоим groups                                                               |
| `HOSTNAME`, `PORT`                     | вручную          | `0.0.0.0`, `3001`                                                                              |
| `NEXTAUTH_URL`                         | вручную          | `https://convertly-hub.bon.kharkov.ua` только после DNS/TLS; до этого generated Northflank URL |
| `NEXTAUTH_SECRET`                      | новый random     | отличается от локального                                                                       |
| `DATABASE_URL`                         | Supabase         | server-only direct/pooler URI; никогда не admin URI; нужен обоим groups                        |
| `MINIO_ENDPOINT`                       | Supabase Storage | S3 endpoint, несмотря на историческое имя variable                                             |
| `S3_REGION`                            | Supabase         | точное значение из project configuration                                                       |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | Supabase Storage | S3 key pair, только server-side                                                                |
| `MINIO_BUCKET`                         | вручную          | `convertly-files`                                                                              |
| `GOTENBERG_URL`                        | Northflank       | `http://convertly-gotenberg:3000`                                                              |
| `SMTP_*`                               | uh.ua            | production SMTP; MailHog не разворачивается                                                    |
| `TELEGRAM_*`                           | позже            | не заполнять до готовности bot/webhook                                                         |

`convertly-migration-runtime` содержит только `NODE_ENV`, `DATABASE_URL` и при
отдельном назначении первого админа временный `SEED_ADMIN_EMAIL`.
`convertly-app-runtime` получает остальные listed runtime values. Не добавляйте
эти values в GitHub repository secrets для Northflank build и не
передавайте их через Docker `ARG`: сборочный image/cache не должен содержать
runtime credentials. Northflank secret group и связанные provider dashboards —
единственные места их хранения.

## 7. Миграции, первый админ и порядок запуска

В Northflank создайте первый **one-off Job** `convertly-migrate` из той же GitHub
ветки и с теми же paths, но с Docker target `migration`:

```text
Dockerfile path:  /convertly-hub/Dockerfile
Build context:    /convertly-hub
Target stage:     migration
Command:           npx prisma migrate deploy
```

Job наследует только `DATABASE_URL` и `NODE_ENV=production` (не S3/SMTP/NextAuth
secrets). Запускайте его вручную после backup/проверки connection string и до
первого app release. Не выполняйте Prisma migrations в `Dockerfile`, build step
или при каждом старте app.

Порядок:

1. Создать Supabase project, private bucket и Northflank private Gotenberg.
2. Создать secret group, migration job и app service с generated Northflank URL.
3. Запустить migration job; он должен завершиться с `0`.
4. Открыть `https://<generated-app-domain>/api/health`: `database`, `storage` и
   `gotenberg` должны быть `up`.
5. Проверить регистрацию и SMTP письмо, вход, reset password, guest flow,
   `JPG ↔ PNG`, `DOCX → PDF`, stored download, privacy mode и API key.
6. Зарегистрировать и подтвердить первый email. Временно добавить только этот
   адрес как `SEED_ADMIN_EMAIL` к **отдельному** one-off job с command
   `node scripts/seed-first-admin.mjs`; после успешного назначения удалить
   переменную из job secrets.

Не запускайте seed вместе с migrate: отсутствие пользователя должно быть ошибкой,
а не скрытым частичным deployment.

## 8. Domain, SMTP и Telegram

1. В Northflank добавьте и подтвердите root domain `bon.kharkov.ua`, затем
   привяжите subdomain `convertly-hub.bon.kharkov.ua` только к public port app.
2. В uh.ua внесите **ровно** DNS records, которые попросит Northflank. Не меняйте
   A/CNAME заранее и не направляйте туда Gotenberg/Supabase.
3. После DNS propagation обновите `NEXTAUTH_URL` на final HTTPS origin и
   перезапустите app. Проверьте ссылки verification/reset заново.
4. SMTP ящик уже создан, но до public demo подтвердите его реальные TLS settings,
   отправку наружу и SPF/DKIM/DMARC. Не открывайте MailHog в интернете.
5. Telegram webhook настраивайте лишь после успешного HTTPS domain и заполнения
   `TELEGRAM_WEBHOOK_SECRET`; он не является prerequisite demo.

## 9. Эксплуатационные ограничения demo

- Northflank/Supabase Free — не production SLA; следите за usage и pause notices.
- Нет гарантированного off-host backup/restore и нет автоматического cleanup
  expired conversion objects. Не храните реальные чувствительные данные.
- App должен иметь один instance: in-memory API/guest/auth limiters не общие между
  репликами.
- `after(() => processConversionJob(...))` — MVP background mechanism. Не
  включайте autoscaling и не обещайте durable queue/retry semantics.
- При `503` health сначала проверяйте поле `database`, `storage` или `gotenberg`;
  не ослабляйте auth/owner checks ради «быстрого» demo fix.

## 10. Откат и переход к настоящему production

Для кода используйте rollback на предыдущий green GitHub commit в Northflank.
Это не восстанавливает PostgreSQL или файлы. Перед переходом на Oracle/Render Paid/
Vercel Pro экспортируйте PostgreSQL и Storage objects, затем выполните отдельный
target runbook. Connection strings, `NEXTAUTH_SECRET`, SMTP и S3 keys в новом
контуре всегда создаются заново.

## 11. Официальные источники

- [Northflank Free tier и pricing](https://northflank.com/pricing)
- [Northflank Dockerfile build context](https://northflank.com/docs/v1/application/build/build-with-a-dockerfile)
- [Northflank private ports](https://northflank.com/docs/v1/application/network/configure-ports)
- [Northflank secret groups](https://northflank.com/docs/v1/application/secure/manage-secret-groups)
- [Supabase Free limits](https://supabase.com/pricing)
- [Supabase S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Supabase S3 server credentials](https://supabase.com/docs/guides/storage/s3/authentication)

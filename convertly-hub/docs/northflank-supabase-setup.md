# Пошаговый запуск demo: Northflank + Supabase

Это практическая инструкция для первого публичного запуска Convertly Hub. Она
дополняет [концепцию и runbook](./northflank-supabase-demo.md), но не заменяет
её: сначала прочтите разделы о схеме и ограничениях, затем проходите этот файл
строго по порядку.

> Цель — **функциональный demo MVP**, а не production. Northflank Developer
> Sandbox и Supabase Free подходят для показа реальных регистрации,
> конвертации и хранения файлов, но не дают SLA, гарантированных backup и
> постоянной доступности. Не загружайте туда чувствительные пользовательские
> данные.

## 0. Короткая карта действий

```text
GitHub main (папка /convertly-hub)
  ├─ Supabase: PostgreSQL + private S3 bucket
  ├─ Northflank: private Gotenberg → migration job → public Next.js app
  ├─ uh.ua: настоящий SMTP
  └─ DNS: convertly-hub.bon.kharkov.ua → Northflank
```

Не пропускайте migration job и не вводите реальные значения в Git. На каждом
этапе ниже есть контрольный результат: если он не достигнут, исправьте его до
перехода дальше.

## 1. Что понадобится заранее

| Что                                     | Зачем                              | Где хранить                    |
| --------------------------------------- | ---------------------------------- | ------------------------------ |
| Доступ владельца к GitHub repository    | Northflank читает source из GitHub | GitHub, не в проекте           |
| Почта для Northflank и Supabase         | регистрация и security notices     | личный почтовый ящик           |
| Пароль Supabase database                | создаётся при project creation     | password manager               |
| `NEXTAUTH_SECRET`                       | подпись HttpOnly-сессий            | только Northflank secret group |
| SMTP параметры `support@bon.kharkov.ua` | verification/reset письма          | только Northflank secret group |
| DNS-доступ к `bon.kharkov.ua`           | custom domain                      | панель uh.ua                   |
| 2FA                                     | защита cloud accounts              | authenticator, не Git          |

На компьютере убедитесь, что актуальный `main` уже опубликован:

```powershell
git switch main
git pull --ff-only
git status --short
git log -1 --oneline
```

`git status --short` должен не выводить ничего. Перед cloud deploy GitHub
Actions для этого commit должны быть зелёными. Не копируйте локальный `.env`:
localhost URLs, локальные MinIO credentials и dev `NEXTAUTH_SECRET` не могут
стать cloud configuration.

### 1.1. Создать новый secret для приложения

В PowerShell можно получить только **новое** значение:

```powershell
openssl rand -base64 48
```

Скопируйте его сразу в password manager как `Convertly Hub / Northflank /
NEXTAUTH_SECRET`. Не отправляйте в чат, issue, commit, screenshot или GitHub
Actions secret. Если значение когда-либо раскрылось, создайте новое и
перезапустите app: существующие сессии станут недействительными — это ожидаемо.

## 2. Регистрация и базовая защита аккаунтов

### 2.1. Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) и создайте
   account. GitHub sign-in допустим, но задайте MFA в Account security.
2. На Free plan нажмите **New project**. Создайте отдельную organisation/project
   для Convertly Hub — не добавляйте его в чужой учебный project.
3. Запишите безопасное имя, например `convertly-hub-demo`, выберите ближайший
   доступный европейский region и задайте сильный database password.
4. Сохраните password в password manager. Он потребуется для подключения, но
   не должен попасть в `.env` в Git или в browser code.
5. Дождитесь состояния project `Active`.

Supabase может запросить подтверждение email и параметры organisation. Это
нормально. Не включайте Supabase Auth: приложение уже использует NextAuth,
Prisma `User` и bcrypt; второй auth provider создал бы две несвязанные модели
пользователя.

### 2.2. Northflank

1. Откройте [Northflank](https://app.northflank.com), зарегистрируйтесь и
   подтвердите email.
2. Включите MFA в account security до подключения repository.
3. При вопросе о team/organisation можно создать личную team `Convertly Hub`.
   Не используйте чужую team без согласованного доступа владельцев.
4. В **Git integrations** подключите GitHub. GitHub предложит установить
   Northflank GitHub App: разрешите доступ только к repository, в котором лежит
   папка `convertly-hub`, а не ко всем repositories аккаунта.
5. Если repository private, это разрешение обязательно. Не делайте его public
   только ради deploy.

Northflank не получает secrets из GitHub Actions. GitHub нужен лишь как source
кода; runtime secrets вводятся позже исключительно в Northflank.

## 3. Подготовить Supabase: база и private Storage

### 3.1. Получить URL PostgreSQL

В созданном project откройте **Connect** / **Database** и найдите connection
strings. Для first deploy используйте **Session pooler** URI, скопированный из
панели полностью и без ручного изменения hostname, port, user или query
параметров. Он удобен для постоянного внешнего Node.js service и случаев, где
direct connection требует IPv6.

Сохраните его в password manager под именем `DATABASE_URL (Northflank demo)`.
Если позднее понадобится direct connection для конкретной операции, не меняйте
работающий runtime URL наугад: сначала выполните отдельный smoke-test. В этом
MVP единственная переменная `DATABASE_URL` используется и приложением, и
migration job.

**Контроль:** URL начинается с `postgresql://` или `postgres://`; в нём нет
`localhost`, `db:5432` или placeholder `replace-with-...`.

### 3.2. Создать private bucket и S3 credentials

1. В Supabase откройте **Storage** и создайте bucket с именем
   `convertly-files`.
2. Выберите **Private**, не Public. Public bucket позволил бы обойти проверки
   владельца в Route Handlers.
3. Откройте Storage S3 configuration и включите S3 protocol, если он ещё
   выключен.
4. Создайте новую S3 access-key pair. Секрет покажется только один раз: сразу
   сохраните оба значения в password manager.
5. Скопируйте S3 endpoint:

   ```text
   https://<project-ref>.storage.supabase.co/storage/v1/s3
   ```

6. Запишите **точный** region project из Supabase configuration. Это значение
   станет `S3_REGION`; не угадывайте `eu-central-1` по расположению на карте.

Supabase Free может фиксировать global Storage file-size limit на `50 MB`. Если
панель не позволяет увеличить его, не обещайте в этом demo файлы или stored
results больше `50 MB`: текущий Enterprise plan приложения допускает input до
`100 MB`, но Storage отвергнет более крупный результат. Это ограничение
провайдера, которое снимается платным plan или отдельным изменением тарифной
логики; оно не повод делать bucket public.

Имена переменных приложения исторически содержат `MINIO_`, но они работают с
любым S3-compatible provider:

| Northflank variable | Значение из Supabase  |
| ------------------- | --------------------- |
| `MINIO_ENDPOINT`    | полный S3 endpoint    |
| `S3_REGION`         | точный region project |
| `MINIO_ACCESS_KEY`  | S3 access key ID      |
| `MINIO_SECRET_KEY`  | S3 secret access key  |
| `MINIO_BUCKET`      | `convertly-files`     |

Не добавляйте Supabase anon key, service-role key или frontend SDK: они не нужны
этому приложению. S3 key pair — server-only credential с широкими правами на
Storage.

## 4. Создать Northflank project и private Gotenberg

1. В Northflank выберите **Create project** → обычный application project.
   Назовите его `convertly-hub-demo` и выберите EU region.
2. Убедитесь, что в project ещё нет лишних services/jobs: free Sandbox имеет
   ограничение на их число.
3. Нажмите **Create service** → service from external image / container image.
4. Укажите image `gotenberg/gotenberg:8` и service name
   `convertly-gotenberg`.
5. В Ports добавьте `3000`, protocol HTTP, visibility **Private**. Не включайте
   public domain.
6. В health check задайте `HTTP GET /health` на port `3000`.
7. Оставьте один instance и выполните deploy.

**Контроль:** service status `Running`/healthy, а в его public domains нет
значения. Gotenberg не должен открываться из браузера по внешнему адресу.

## 5. Создать secret groups до app service

В Northflank откройте project → **Secret groups** и создайте две группы. Это
безопаснее, чем копировать один полный список в каждый resource.

### 5.1. `convertly-app-runtime`

Привяжите группу **только** к будущему `convertly-app`. Добавьте эти runtime
variables:

| Variable                                | Значение                                 |
| --------------------------------------- | ---------------------------------------- |
| `NODE_ENV`                              | `production`                             |
| `HOSTNAME`                              | `0.0.0.0`                                |
| `PORT`                                  | `3001`                                   |
| `NEXTAUTH_URL`                          | тот же HTTPS origin без завершающего `/` |
| `NEXTAUTH_SECRET`                       | secret из шага 1.1                       |
| `DATABASE_URL`                          | Supabase Session pooler URI              |
| `MINIO_ENDPOINT`                        | Supabase S3 endpoint                     |
| `S3_REGION`                             | region Supabase project                  |
| `MINIO_ACCESS_KEY`                      | Supabase S3 access key                   |
| `MINIO_SECRET_KEY`                      | Supabase S3 secret                       |
| `MINIO_BUCKET`                          | `convertly-files`                        |
| `GOTENBERG_URL`                         | `http://convertly-gotenberg:3000`        |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | точные настройки uh.ua SMTP              |
| `SMTP_FROM`                             | `Convertly Hub <support@bon.kharkov.ua>` |
| `SMTP_USER`, `SMTP_PASSWORD`            | учётные данные ящика                     |

`APP_DOMAIN` не добавляйте: он нужен Oracle-варианту с Caddy, но не используется
Northflank/Next.js runtime. `NEXTAUTH_URL` не должен быть `localhost`, plain
HTTP или URL Supabase. До создания public app service его generated HTTPS domain
ещё неизвестен — добавьте эту переменную сразу после создания service. После DNS
замените её на `https://convertly-hub.bon.kharkov.ua`.

Не добавляйте `TELEGRAM_*`: Telegram ещё не является prerequisite этого demo.

### 5.2. `convertly-migration-runtime`

Создайте вторую группу и примените её **только** к job. В ней нужны:

```dotenv
NODE_ENV=production
DATABASE_URL=<тот же Supabase Session pooler URI>
```

Не выдавайте job `NEXTAUTH_SECRET`, SMTP password или S3 key pair: migration не
нужны эти права.

## 6. Создать migration job

1. В Northflank выберите **Create job** → build from GitHub repository.
2. Выберите repository и ветку `main`.
3. В Docker build options укажите именно:

   ```text
   Build type:       Dockerfile
   Dockerfile path:  /convertly-hub/Dockerfile
   Build context:    /convertly-hub
   Target stage:     migration
   ```

4. Назовите job `convertly-migrate`.
5. В command override задайте:

   ```text
   npx prisma migrate deploy
   ```

6. Подключите только `convertly-migration-runtime`, создайте job и запустите
   его вручную.

Перед первым **Run** создайте image: job → **Code → Builds → Start build**,
выберите `main`/latest commit и дождитесь `Succeeded`. В форме **Run** выберите
этот build в обязательном поле `Build`; Northflank не создаёт первый build
автоматически по нажатию Run.

Northflank выполняет shallow clone Git repository, но Docker build context
`/convertly-hub` гарантирует, что `COPY .` видит только нужную папку, а не
остальные домашние проекты из repository.

**Контроль:** лог заканчивается `All migrations have been successfully applied`
и job имеет exit code `0`. При ошибке connection string не удаляйте schema и не
применяйте `prisma migrate reset`: сначала сверяйте `DATABASE_URL`, Supabase
project status и логи job.

## 7. Создать public Next.js service из GitHub

1. В том же Northflank project нажмите **Create service** → build from GitHub
   repository / Combined Service.
2. Выберите тот же repository и ветку `main`.
3. Используйте те же критичные build settings, кроме target:

   ```text
   Build type:       Dockerfile
   Dockerfile path:  /convertly-hub/Dockerfile
   Build context:    /convertly-hub
   Target stage:     runner
   ```

4. Назовите service `convertly-app`.
5. В Ports создайте `3001`, protocol HTTP, visibility **Public**.
6. Подключите только secret group `convertly-app-runtime`.
7. Health check: `HTTP GET /api/health` на port `3001`.
8. Instances: ровно `1`; autoscaling пока выключен, поскольку guest/API rate
   limiters находятся в памяти одного процесса.
9. Создайте service и дождитесь build/deploy.

После создания service состояние `No build` и `0 / 1` ожидаемо. Откройте
**Code → Builds → Start build**, выберите `main`/latest commit; при workflow
`Always deploying latest builds` успешный build будет развёрнут автоматически.
Сразу после создания service добавьте в `convertly-app-runtime`:

```dotenv
NEXTAUTH_URL=https://<generated-northflank-domain>
```

и перезапустите зависимый service после сохранения group.

**Контроль build:** в логах должны быть найдены `convertly-hub/package.json`,
`prisma` и `next build`. Ошибка `package.json not found` почти всегда означает
неверный build context. Не меняйте Dockerfile, пока не перепроверены оба пути из
таблицы выше.

## 8. Первый запуск на generated Northflank URL

1. Откройте public generated HTTPS URL service.
2. Откройте `<generated-url>/api/health`.
3. Ответ должен иметь все значения `up`:

   ```json
   {
     "status": "healthy",
     "database": "up",
     "storage": "up",
     "gotenberg": "up"
   }
   ```

Если `storage: down`, сначала сверяйте private bucket, S3 endpoint, region и
S3 key pair. Если `gotenberg: down`, сверяйте private port `3000`, имя service и
`GOTENBERG_URL`; не делайте service public. Если `database: down`, сверяйте
полный copied Supabase Session pooler URI.

Проверьте в браузере до domain switch:

1. регистрация с тестовым email;
2. письмо verification через реальный SMTP;
3. вход и Dashboard;
4. `JPG → PNG`, `PNG → JPG`, `DOCX → PDF`;
5. сохранённый result и скачивание из History;
6. guest conversion и месячный лимит;
7. создание API key и API conversion;
8. парольный reset;
9. admin роль после следующего шага.

## 9. Назначить первого администратора

1. Подтвердите email зарегистрированного пользователя из шага 8.
2. Создайте второй one-off job `convertly-seed-first-admin` с теми же GitHub
   settings и target `migration`, что у migration job.
3. В command override укажите:

   ```text
   node scripts/seed-first-admin.mjs
   ```

4. Создайте третью узкую secret group `convertly-seed-first-admin-runtime`,
   подключите её только к этому job и добавьте:

   ```dotenv
   NODE_ENV=production
   DATABASE_URL=<тот же Supabase Session pooler URI>
   SEED_ADMIN_EMAIL=<verified user email>
   ```

5. Запустите job один раз, убедитесь в успехе, затем удалите
   `SEED_ADMIN_EMAIL`, отключите/удалите job и его отдельную secret group.

Это сохраняет лимит Sandbox на два jobs и не оставляет email первого admin в
постоянных secrets. Для обычной смены роли в будущем используйте отдельный
админский процесс, а не повторяйте seed вслепую.

## 10. Подключить собственный domain и SMTP

### 10.1. Domain

1. В Northflank добавьте domain `bon.kharkov.ua` и выберите public port service
   `convertly-app`.
2. Панель покажет конкретную DNS-запись. Откройте панель uh.ua и создайте ровно
   её для `convertly-hub.bon.kharkov.ua`.
3. Не создавайте A/CNAME «на глаз», не направляйте subdomain на Gotenberg и не
   меняйте MX-записи почты.
4. Дождитесь статуса domain `Verified` и активного TLS certificate в
   Northflank.
5. В `convertly-app-runtime` замените **одновременно**:

   ```dotenv
   NEXTAUTH_URL=https://convertly-hub.bon.kharkov.ua
   ```

6. Перезапустите/передеплойте app и снова выполните verification/reset links.

Не переключайте `NEXTAUTH_URL` на новый domain, пока TLS ещё не активен:
иначе auth-письма будут содержать недоступные ссылки.

### 10.2. SMTP

1. В панели uh.ua или документации почты найдите точные `SMTP_HOST`, `PORT`,
   TLS mode, username и password.
2. Обычно port `465` соответствует `SMTP_SECURE=true`; port `587` обычно
   требует `SMTP_SECURE=false`. Используйте фактические данные провайдера, а не
   это общее правило.
3. Введите их только в `convertly-app-runtime`.
4. Проверьте delivery на внешний тестовый ящик и ссылку в verification/reset
   письме.

Если UI возвращает `503` при отправке, откройте логи `convertly-app` и найдите
`Authentication email delivery failed.`. Приложение выводит только безопасные
технические поля `kind`, `errorName`, `code`, `command`, `responseCode`; пароль,
получатель, одноразовая ссылка и полный ответ SMTP в лог не попадают. Этих полей
достаточно, чтобы отличить ошибку авторизации (`EAUTH`/`535`) от сетевой
недоступности (`ETIMEDOUT`, `ECONNREFUSED` или `ESOCKET`).
5. Если провайдер предоставляет SPF/DKIM/DMARC записи, внесите их до приглашения
   реальных пользователей.

MailHog — исключительно локальный сервис. В Northflank его не создают и не
делают публичным.

## 11. Как работать после каждого commit и push

### Обычное изменение приложения

1. Работайте в feature/fix ветке, запускайте локальные проверки.
2. Выполните explicit merge в локальный `main` по правилам проекта.
3. Опубликуйте `main`:

   ```powershell
   git push origin main
   ```

4. Убедитесь, что все GitHub Actions зелёные.
5. Если в Northflank включён auto-deploy для `main`, следите за новым build в
   service `convertly-app`. Если auto-deploy выключен, в панели выберите deploy
   latest `main` commit вручную.
6. После deploy откройте `/api/health` и выполните короткий browser smoke-test.

### Если commit содержит Prisma migration

Порядок другой: **сначала migration job, затем app**.

1. Push `main`, дождитесь зелёного CI.
2. Запустите `convertly-migrate` на том же latest commit и дождитесь exit `0`.
3. Только после этого deploy/разрешите auto-deploy `convertly-app`.
4. Проверьте `/api/health` и путь, который использует новую schema.

Не используйте `prisma db push`, `migrate reset` или автоматические migrations
при каждом запуске service. Миграции должны быть уже в Git и применяться один
раз управляемым job.

### Если меняются secrets

1. Измените значение только в подходящей Northflank secret group.
2. Deploy/restart только resource, которому нужна переменная.
3. Проверьте соответствующий сценарий: SMTP — письмо, S3 — stored conversion,
   NextAuth secret — новый login.
4. При утечке сначала создайте/замените credential у провайдера, затем обновите
   Northflank; старое значение отзовите после успешной проверки.

## 12. Эксплуатация и диагностика

Каждый раз, когда service выглядит недоступным, сначала проверьте:

1. Northflank app deployment logs и status.
2. `<domain>/api/health` — какой именно dependency `down`.
3. Supabase project `Active`, database usage и Storage usage.
4. Private Gotenberg status и его health.
5. DNS/TLS status только если не открывается custom domain.

Не используйте облачные логи как место для secrets. В support request и
screenshot маскируйте connection strings, API keys и SMTP passwords.

Раз в неделю вручную:

- открывайте Supabase, чтобы не пропустить pause/usage notification;
- проверяйте, что private bucket не растёт бесконтрольно;
- делайте export PostgreSQL и нужных demo objects перед рискованным обновлением;
- просматривайте Northflank deploy logs и GitHub Actions.

Истёкший `expiresAt` уже запрещает download на уровне приложения, но эта demo
схема пока не имеет автоматического физического cleanup S3 objects. Поэтому
Storage usage надо контролировать вручную.

## 13. Откат

При неудачном code deploy выберите в Northflank предыдущий green build/commit и
разверните его обратно. Это откатывает app image, но **не** database migration и
не удаляет объекты Storage. Никогда не пытайтесь откатить Prisma migration
ручным удалением таблиц в Supabase. Для schema rollback нужна отдельная,
проверенная forward migration.

## 14. Официальные справки

- [Northflank: подключение Git account](https://northflank.com/docs/v1/application/getting-started/link-your-git-account)
- [Northflank: Dockerfile и build context](https://northflank.com/docs/v1/application/build/build-with-a-dockerfile)
- [Northflank: secret groups](https://northflank.com/docs/v1/application/secure/manage-secret-groups)
- [Northflank: configure ports](https://northflank.com/docs/v1/application/network/configure-ports)
- [Northflank: domains](https://northflank.com/docs/v1/application/domains/add-a-domain-to-your-account)
- [Supabase: database connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: S3 authentication](https://supabase.com/docs/guides/storage/s3/authentication)

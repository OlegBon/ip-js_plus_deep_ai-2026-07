# Покроковий запуск demo: Northflank + Supabase

Це практична інструкція для першого публічного запуску Convertly Hub. Вона
доповнює [концепцію та runbook](./northflank-supabase-demo.md), але не замінює
їх: спочатку прочитайте розділи про схему й обмеження, потім проходьте цей файл
суворо по порядку.

> Мета — **функціональний demo MVP**, а не production. Northflank Developer
> Sandbox і Supabase Free підходять для демонстрації реальних реєстрації,
> конвертації та зберігання файлів, але не надають SLA, гарантованих backup і
> постійної доступності. Не завантажуйте туди чутливі дані користувачів.

## 0. Коротка карта дій

```text
GitHub main (папка /convertly-hub)
  ├─ Supabase: PostgreSQL + private S3 bucket
  ├─ Northflank: private Gotenberg → migration job → public Next.js app
  ├─ uh.ua: реальний SMTP
  └─ DNS: convertly-hub.bon.kharkov.ua → Northflank
```

Не пропускайте migration job і не вводьте реальні значення до Git. Перед кожною
production migration створюйте логічний SQL backup за
[supabase-logical-backup.md](./supabase-logical-backup.md). На каждом
етапі нижче є контрольний результат: якщо його не досягнуто, виправте це перед
переходом далі.

## 1. Що знадобиться заздалегідь

| Що                                      | Навіщо                             | Де зберігати                   |
| --------------------------------------- | ---------------------------------- | ------------------------------ |
| Доступ власника до GitHub repository    | Northflank читає source з GitHub   | GitHub, не у проєкті           |
| Пошта для Northflank і Supabase         | реєстрація та security notices     | особиста поштова скринька      |
| Пароль Supabase database                | створюється під час project creation | password manager             |
| `NEXTAUTH_SECRET`                       | підпис HttpOnly-сесій              | лише Northflank secret group   |
| SMTP параметри `support@bon.kharkov.ua` | verification/reset листи           | лише Northflank secret group   |
| DNS-доступ до `bon.kharkov.ua`          | custom domain                      | панель uh.ua                   |
| 2FA                                     | захист cloud accounts              | authenticator, не Git          |

На комп'ютері переконайтеся, що актуальний `main` уже опубліковано:

```powershell
git switch main
git pull --ff-only
git status --short
git log -1 --oneline
```

`git status --short` не має нічого виводити. Перед cloud deploy GitHub
Actions для цього commit мають бути успішними. Не копіюйте локальний `.env`:
localhost URLs, локальні MinIO credentials і dev `NEXTAUTH_SECRET` не можуть
стати cloud configuration.

### 1.1. Створити новий secret для застосунку

У PowerShell можна отримати лише **нове** значення:

```powershell
openssl rand -base64 48
```

Одразу скопіюйте його до password manager як `Convertly Hub / Northflank /
NEXTAUTH_SECRET`. Не надсилайте його в чат, issue, commit, screenshot або GitHub
Actions secret. Якщо значення коли-небудь розкрилося, створіть нове та
перезапустіть app: наявні сесії стануть недійсними — це очікувано.

## 2. Реєстрація та базовий захист облікових записів

### 2.1. Supabase

1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard) і створіть
   account. GitHub sign-in допустимий, але налаштуйте MFA в Account security.
2. На Free plan натисніть **New project**. Створіть окремий organisation/project
   для Convertly Hub — не додавайте його до чужого навчального project.
3. Вкажіть безпечну назву, наприклад `convertly-hub-demo`, оберіть найближчий
   доступний європейський region і задайте надійний database password.
4. Збережіть password у password manager. Він знадобиться для підключення, але
   не має потрапити до `.env` у Git або до browser code.
5. Дочекайтеся стану project `Active`.

Supabase може запросити підтвердження email і параметри organisation. Це
нормально. Не вмикайте Supabase Auth: застосунок уже використовує NextAuth,
Prisma `User` і bcrypt; другий auth provider створив би дві не пов'язані моделі
користувача.

### 2.2. Northflank

1. Відкрийте [Northflank](https://app.northflank.com), зареєструйтеся та
   підтвердьте email.
2. Увімкніть MFA в account security до підключення repository.
3. На запит про team/organisation можна створити особисту team `Convertly Hub`.
   Не використовуйте чужу team без погодженого доступу власників.
4. У **Git integrations** підключіть GitHub. GitHub запропонує встановити
   Northflank GitHub App: надайте доступ лише до repository, у якому лежить
   папка `convertly-hub`, а не до всіх repositories облікового запису.
5. Якщо repository private, цей дозвіл обов'язковий. Не робіть його public
   лише заради deploy.

Northflank не отримує secrets із GitHub Actions. GitHub потрібен лише як source
коду; runtime secrets вводяться пізніше винятково у Northflank.

## 3. Підготувати Supabase: база та private Storage

### 3.1. Отримати URL PostgreSQL

У створеному project відкрийте **Connect** / **Database** та знайдіть connection
strings. Для first deploy використовуйте **Session pooler** URI, скопійований із
панелі повністю та без ручної зміни hostname, port, user або query
параметрів. Він зручний для постійного зовнішнього Node.js service і випадків, де
direct connection потребує IPv6.

Збережіть його в password manager під назвою `DATABASE_URL (Northflank demo)`.
Якщо пізніше знадобиться direct connection для конкретної операції, не змінюйте
робочий runtime URL навмання: спершу виконайте окремий smoke-test. У цьому
MVP єдина змінна `DATABASE_URL` використовується і застосунком, і
migration job.

**Контроль:** URL починається з `postgresql://` або `postgres://`; у ньому немає
`localhost`, `db:5432` або placeholder `replace-with-...`.

### 3.2. Створити private bucket і S3 credentials

1. У Supabase відкрийте **Storage** та створіть bucket з назвою
   `convertly-files`.
2. Оберіть **Private**, не Public. Public bucket дозволив би обійти перевірки
   власника в Route Handlers.
3. Відкрийте Storage S3 configuration і ввімкніть S3 protocol, якщо його ще
   вимкнено.
4. Створіть нову S3 access-key pair. Секрет буде показано лише один раз: одразу
   збережіть обидва значення в password manager.
5. Скопіюйте S3 endpoint:

   ```text
   https://<project-ref>.storage.supabase.co/storage/v1/s3
   ```

6. Запишіть **точний** region project із Supabase configuration. Це значення
   стане `S3_REGION`; не вгадуйте `eu-central-1` за розташуванням на карті.

Supabase Free може фіксувати global Storage file-size limit на `50 MB`. Якщо
панель не дозволяє збільшити його, не обіцяйте в цьому demo файли або stored
results більші за `50 MB`: поточний Enterprise plan застосунку допускає input до
`100 MB`, але Storage відхилить більший результат. Це обмеження
provider, яке знімається платним plan або окремою зміною тарифної
логіки; це не привід робити bucket public.

Назви змінних застосунку історично містять `MINIO_`, але вони працюють із
будь-яким S3-compatible provider:

| Northflank variable | Значення із Supabase  |
| ------------------- | --------------------- |
| `MINIO_ENDPOINT`    | повний S3 endpoint    |
| `S3_REGION`         | точний region project |
| `MINIO_ACCESS_KEY`  | S3 access key ID      |
| `MINIO_SECRET_KEY`  | S3 secret access key  |
| `MINIO_BUCKET`      | `convertly-files`     |

Не додавайте Supabase anon key, service-role key або frontend SDK: вони не потрібні
цьому застосунку. S3 key pair — server-only credential із широкими правами на
Storage.

## 4. Створити Northflank project і private Gotenberg

1. У Northflank оберіть **Create project** → звичайний application project.
   Назвіть його `convertly-hub-demo` і оберіть EU region.
2. Переконайтеся, що у project ще немає зайвих services/jobs: free Sandbox має
   обмеження на їх кількість.
3. Натисніть **Create service** → service from external image / container image.
4. Укажіть image `gotenberg/gotenberg:8` і service name
   `convertly-gotenberg`.
5. У Ports додайте `3000`, protocol HTTP, visibility **Private**. Не вмикайте
   public domain.
6. У health check задайте `HTTP GET /health` на port `3000`.
7. Залиште один instance та виконайте deploy.

**Контроль:** service status `Running`/healthy, а у його public domains немає
значення. Gotenberg не має відкриватися з браузера за зовнішньою адресою.

## 5. Створити secret groups до app service

У Northflank відкрийте project → **Secret groups** і створіть дві групи. Це
безпечніше, ніж копіювати один повний список до кожного resource.

### 5.1. `convertly-app-runtime`

Прив'яжіть групу **лише** до майбутнього `convertly-app`. Додайте ці runtime
variables:

| Variable                                | Значення                                |
| --------------------------------------- | ---------------------------------------- |
| `NODE_ENV`                              | `production`                             |
| `HOSTNAME`                              | `0.0.0.0`                                |
| `PORT`                                  | `3001`                                   |
| `NEXTAUTH_URL`                          | той самий HTTPS origin без завершального `/` |
| `NEXTAUTH_SECRET`                       | secret із кроку 1.1                      |
| `DATABASE_URL`                          | Supabase Session pooler URI              |
| `MINIO_ENDPOINT`                        | Supabase S3 endpoint                     |
| `S3_REGION`                             | region Supabase project                  |
| `MINIO_ACCESS_KEY`                      | Supabase S3 access key                   |
| `MINIO_SECRET_KEY`                      | Supabase S3 secret                       |
| `MINIO_BUCKET`                          | `convertly-files`                        |
| `GOTENBERG_URL`                         | `http://convertly-gotenberg:3000`        |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | точні налаштування uh.ua SMTP            |
| `SMTP_FROM`                             | `Convertly Hub <support@bon.kharkov.ua>` |
| `SMTP_USER`, `SMTP_PASSWORD`            | облікові дані скриньки                   |

`APP_DOMAIN` не додавайте: він потрібен Oracle-варіанту з Caddy, але не використовується
Northflank/Next.js runtime. `NEXTAUTH_URL` не має бути `localhost`, plain
HTTP або URL Supabase. До створення public app service його generated HTTPS domain
ще невідомий — додайте цю змінну одразу після створення service. Після DNS
замініть її на `https://convertly-hub.bon.kharkov.ua`.

Для Telegram password recovery додайте `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_BOT_USERNAME` і `TELEGRAM_WEBHOOK_SECRET` лише до
`convertly-app-runtime`, перед deploy застосунку. Після deploy налаштуйте Bot API
webhook на `https://convertly-hub.bon.kharkov.ua/api/telegram/webhook` із тим самим
secret token і перевірте `getWebhookInfo`, Dashboard linking, reset за
`@username`, зміну пароля та повторний вхід. Не додавайте ці змінні до
migration job.

### 5.2. `convertly-migration-runtime`

Створіть другу групу та застосуйте її **лише** до job. У ній потрібні:

```dotenv
NODE_ENV=production
DATABASE_URL=<той самий Supabase Session pooler URI>
```

Не надавайте job `NEXTAUTH_SECRET`, SMTP password або S3 key pair: migration не
потрібні ці права.

## 6. Створити migration job

1. У Northflank оберіть **Create job** → build from GitHub repository.
2. Оберіть repository і гілку `main`.
3. У Docker build options укажіть саме:

   ```text
   Build type:       Dockerfile
   Dockerfile path:  /convertly-hub/Dockerfile
   Build context:    /convertly-hub
   Target stage:     migration
   ```

4. Назвіть job `convertly-migrate`.
5. У command override задайте:

   ```text
   npx prisma migrate deploy
   ```

6. Підключіть лише `convertly-migration-runtime`, створіть job і запустіть
   його вручну.

Перед першим **Run** створіть image: job → **Code → Builds → Start build**,
оберіть `main`/latest commit і дочекайтеся `Succeeded`. У формі **Run** оберіть
цей build в обов'язковому полі `Build`; Northflank не створює перший build
автоматично за натисканням Run.

Northflank виконує shallow clone Git repository, але Docker build context
`/convertly-hub` гарантує, що `COPY .` бачить лише потрібну папку, а не
інші домашні проєкти з repository.

**Контроль:** лог завершується `All migrations have been successfully applied`
і job має exit code `0`. У разі помилки connection string не видаляйте schema та не
застосовуйте `prisma migrate reset`: спочатку зіставте `DATABASE_URL`, Supabase
project status і логи job.

## 7. Створити public Next.js service із GitHub

1. У тому самому Northflank project натисніть **Create service** → build from GitHub
   repository / Combined Service.
2. Оберіть той самий repository і гілку `main`.
3. Використовуйте ті самі критичні build settings, окрім target:

   ```text
   Build type:       Dockerfile
   Dockerfile path:  /convertly-hub/Dockerfile
   Build context:    /convertly-hub
   Target stage:     runner
   ```

4. Назвіть service `convertly-app`.
5. У Ports створіть `3001`, protocol HTTP, visibility **Public**.
6. Підключіть лише secret group `convertly-app-runtime`.
7. Health check: `HTTP GET /api/health` на port `3001`.
8. Instances: рівно `1`; autoscaling поки вимкнений, оскільки guest/API rate
   limiters перебувають у пам'яті одного процесу.
9. Створіть service і дочекайтеся build/deploy.

Після створення service стан `No build` і `0 / 1` очікуваний. Відкрийте
**Code → Builds → Start build**, оберіть `main`/latest commit; за workflow
`Always deploying latest builds` успішний build буде розгорнуто автоматично.
Одразу після створення service додайте до `convertly-app-runtime`:

```dotenv
NEXTAUTH_URL=https://<generated-northflank-domain>
```

і перезапустіть залежний service після збереження group.

Для workflow видалення облікового запису також додайте до цієї самої group не-секретне значення:

```dotenv
SUPPORT_EMAIL=support@bon.kharkov.ua
```

Воно використовується лише як destination операційних сповіщень про запит, успіх або збій
видалення; SMTP credentials і надалі залишаються secret variables.

**Контроль build:** у логах мають бути знайдені `convertly-hub/package.json`,
`prisma` і `next build`. Помилка `package.json not found` майже завжди означає
неправильний build context. Не змінюйте Dockerfile, доки не перевірено обидва шляхи з
таблиці вище.

## 8. Перший запуск на generated Northflank URL

1. Відкрийте public generated HTTPS URL service.
2. Відкрийте `<generated-url>/api/health`.
3. Відповідь має містити всі значення `up`:

   ```json
   {
     "status": "healthy",
     "database": "up",
     "storage": "up",
     "gotenberg": "up"
   }
   ```

Якщо `storage: down`, спочатку зіставте private bucket, S3 endpoint, region і
S3 key pair. Якщо `gotenberg: down`, зіставте private port `3000`, назву service та
`GOTENBERG_URL`; не робіть service public. Якщо `database: down`, зіставте
повний copied Supabase Session pooler URI.

Перевірте у браузері до domain switch:

1. реєстрацію з тестовим email;
2. лист verification через реальний SMTP;
3. вхід і Dashboard;
4. `JPG → PNG`, `PNG → JPG`, `DOCX → PDF`;
5. збережений result і завантаження з History;
6. guest conversion та місячний ліміт;
7. створення API key і API conversion;
8. password reset;
9. admin роль після наступного кроку.

## 9. Призначити першого адміністратора

1. Підтвердьте email зареєстрованого користувача з кроку 8.
2. Створіть другий one-off job `convertly-seed-first-admin` з такими самими GitHub
   settings і target `migration`, як у migration job.
3. У command override укажіть:

   ```text
   node scripts/seed-first-admin.mjs
   ```

4. Створіть третю вузьку secret group `convertly-seed-first-admin-runtime`,
   підключіть її лише до цього job і додайте:

   ```dotenv
   NODE_ENV=production
DATABASE_URL=<той самий Supabase Session pooler URI>
   SEED_ADMIN_EMAIL=<verified user email>
   ```

5. Запустіть job один раз, переконайтеся в успіху, потім видаліть
   `SEED_ADMIN_EMAIL`, відключіть/видаліть job і його окрему secret group.

Це зберігає ліміт Sandbox на два jobs і не залишає email першого admin у
постійних secrets. Для звичайної зміни ролі в майбутньому використовуйте окремий
адмінський процес, а не повторюйте seed навмання.

### 9.1. Разово синхронізувати тариф тестового користувача

Поки немає справжнього billing provider, призначайте Basic/Pro/Enterprise лише
контрольованим one-off запуском. Новий script не приймає plan з HTTP, не
створює користувача та не виводить email або connection string у logs. В одній
короткій database transaction він синхронізує обидва історичні поля:
`Subscription.activePlan`; `User.plan` більше не існує.

На Sandbox не створюйте для цього третій постійний job: ліміт jobs обмежений.
Використовуйте вже наявний ручний `convertly-migrate`, оскільки його image
має target `migration` і отримує лише `DATABASE_URL` із вузької групи
`convertly-migration-runtime`.

1. Переконайтеся, що latest `main` build job уже містить
   `scripts/sync-user-plan.mjs`. За потреби створіть новий build із
   latest `main`; не використовуйте старий image.
2. У `convertly-migrate` натисніть **Run**, оберіть цей build і розкрийте
   **Environment variables**. Додайте значення лише для поточного запуску:

   ```dotenv
   PLAN_SYNC_EMAIL=<registered-user-email>
   PLAN_SYNC_ACTIVE_PLAN=BASIC
   ```

   Допустимі лише `FREE`, `BASIC`, `PRO`, `ENTERPRISE`. Email нормалізується до
   lowercase; не зберігайте ці дві змінні у job settings або secret group.

3. У **Advanced Docker options** оберіть разову **Custom command** і вкажіть:

   ```text
   node scripts/sync-user-plan.mjs
   ```

   Не змінюйте збережений CMD override job: його звичайна команда має лишитися
   `npx prisma migrate deploy`.

4. Запустіть job і дочекайтеся exit code `0`. Успішний log має вигляд
   `Plan synchronized: <old> -> <new>.` і не розкриває email.
5. У Supabase Table Editor або Prisma Studio переконайтеся, що змінюється лише
   `Subscription.activePlan`; потім перезайдіть цим користувачем і перевірте
   Dashboard/API access.

Скрипт ідемпотентний: повторний запуск із тими самими input безпечний. Якщо email не
знайдено або plan неправильний, transaction не почне запис. Він навмисно очищає
старий demo-запит тарифу (`requestedPlan`) і робить subscription `ACTIVE`.
Не застосовуйте цей шлях після підключення справжньої оплати: тоді тариф має
змінювати лише перевірений webhook provider.

На платному Northflank plan можна замість повторного використання migration job створити
окремий manual-only `convertly-sync-user-plan` з тими самими source/target
`migration`, тією самою вузькою `DATABASE_URL` group і постійною командою вище. Для
кожного Run однаково передавайте email і plan як run-only overrides.

## 10. Підключити власний domain і SMTP

### 10.1. Domain

1. У Northflank додайте domain `bon.kharkov.ua` та оберіть public port service
   `convertly-app`.
2. Панель покаже конкретний DNS-запис. Відкрийте панель uh.ua та створіть саме
   його для `convertly-hub.bon.kharkov.ua`.
3. Не створюйте A/CNAME «на око», не спрямовуйте subdomain на Gotenberg і не
   змінюйте MX-записи пошти.
4. Дочекайтеся статусу domain `Verified` і активного TLS certificate у
   Northflank.
5. У `convertly-app-runtime` замініть **одночасно**:

   ```dotenv
   NEXTAUTH_URL=https://convertly-hub.bon.kharkov.ua
   ```

6. Перезапустіть/перерозгорніть app і знову виконайте verification/reset links.

Не перемикайте `NEXTAUTH_URL` на новий domain, доки TLS ще не активний:
інакше auth-листи міститимуть недоступні посилання.

### 10.2. SMTP

1. У панелі uh.ua або документації пошти знайдіть точні `SMTP_HOST`, `PORT`,
   TLS mode, username і password.
2. Зазвичай port `465` відповідає `SMTP_SECURE=true`; port `587` зазвичай
   потребує `SMTP_SECURE=false`. Використовуйте фактичні дані provider, а не
   це загальне правило.
3. Введіть їх лише до `convertly-app-runtime`.
4. Перевірте delivery на зовнішню тестову скриньку та посилання у verification/reset
   листі.

Якщо UI повертає `503` під час надсилання, відкрийте логи `convertly-app` і знайдіть
`Authentication email delivery failed.`. Застосунок виводить лише безпечні
технічні поля `kind`, `errorName`, `code`, `command`, `responseCode`; пароль,
одержувач, одноразове посилання та повна SMTP-відповідь до логу не потрапляють. Цих полів
достатньо, щоб відрізнити помилку авторизації (`EAUTH`/`535`) від мережевої
недоступності (`ETIMEDOUT`, `ECONNREFUSED` або `ESOCKET`). 5. Якщо provider надає SPF/DKIM/DMARC записи, внесіть їх до запрошення
реальних користувачів.

MailHog — виключно локальний сервіс. У Northflank його не створюють і не
роблять публічним.

## 11. Як працювати після кожного commit і push

### Звичайна зміна застосунку

1. Працюйте у feature/fix гілці, запускайте локальні перевірки.
2. Виконайте explicit merge до локального `main` за правилами проєкту.
3. Опублікуйте `main`:

   ```powershell
   git push origin main
   ```

4. Переконайтеся, що всі GitHub Actions успішні.
5. Якщо у Northflank увімкнено auto-deploy для `main`, стежте за новим build у
   service `convertly-app`. Якщо auto-deploy вимкнений, у панелі оберіть deploy
   latest `main` commit вручну.
6. Після deploy відкрийте `/api/health` і виконайте короткий browser smoke-test.

### Якщо commit містить Prisma migration

Порядок інший: **спочатку migration job, потім app**.

1. Push `main`, дочекайтеся успішного CI.
2. Запустіть `convertly-migrate` на тому самому latest commit і дочекайтеся exit `0`.
3. Лише після цього deploy/дозвольте auto-deploy `convertly-app`.
4. Перевірте `/api/health` і шлях, який використовує нову schema.

Не використовуйте `prisma db push`, `migrate reset` або автоматичні migrations
під час кожного запуску service. Міграції мають уже бути в Git і застосовуватися один
раз керованим job.

### Якщо змінюються secrets

1. Змініть значення лише у відповідній Northflank secret group.
2. Deploy/restart лише resource, якому потрібна змінна.
3. Перевірте відповідний сценарій: SMTP — лист, S3 — stored conversion,
   NextAuth secret — новий login.
4. У разі витоку спочатку створіть/замініть credential у provider, потім оновіть
   Northflank; старе значення відкличте після успішної перевірки.

## 12. Експлуатація та діагностика

Щоразу, коли service виглядає недоступним, спочатку перевірте:

1. Northflank app deployment logs и status.
2. `<domain>/api/health` — какой именно dependency `down`.
3. Supabase project `Active`, database usage і Storage usage.
4. Private Gotenberg status і його health.
5. DNS/TLS status лише якщо не відкривається custom domain.

Не використовуйте хмарні логи як місце для secrets. У support request і
screenshot маскуйте connection strings, API keys і SMTP passwords.

Раз на тиждень вручну:

- відкривайте Supabase, щоб не пропустити pause/usage notification;
- перевіряйте, що private bucket не зростає безконтрольно;
- робіть export PostgreSQL і потрібних demo objects перед ризикованим оновленням;
- переглядайте Northflank deploy logs і GitHub Actions.

Спливлий `expiresAt` уже забороняє download на рівні застосунку, але ця demo
схема поки не має автоматичного фізичного cleanup S3 objects. Тому
Storage usage треба контролювати вручну.

## 13. Відкат

У разі невдалого code deploy оберіть у Northflank попередній green build/commit і
розгорніть його назад. Це відкочує app image, але **не** database migration і
не видаляє об'єкти Storage. Ніколи не намагайтеся відкотити Prisma migration
ручним видаленням таблиць у Supabase. Для schema rollback потрібна окрема,
перевірена forward migration.

## 14. Офіційні довідки

- [Northflank: подключение Git account](https://northflank.com/docs/v1/application/getting-started/link-your-git-account)
- [Northflank: Dockerfile и build context](https://northflank.com/docs/v1/application/build/build-with-a-dockerfile)
- [Northflank: secret groups](https://northflank.com/docs/v1/application/secure/manage-secret-groups)
- [Northflank: configure ports](https://northflank.com/docs/v1/application/network/configure-ports)
- [Northflank: domains](https://northflank.com/docs/v1/application/domains/add-a-domain-to-your-account)
- [Supabase: database connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: S3 authentication](https://supabase.com/docs/guides/storage/s3/authentication)

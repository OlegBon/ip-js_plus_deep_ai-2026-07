# Журнал змін проєкту

# 2026-09-08

- **Задача:** UX і операційне оформлення Telegram-бота.
- **Змінені файли:** `lib/telegram/bot.ts`, Telegram webhook і Jest tests, новий `docs/telegram-bot-setup.md`, deployment/local guides, architecture, backlog і `docs/progress.md`.
- **Результат:** У private chat бот надає welcome через `/start`, допомогу через `/help`, нейтральну відповідь на невідоме повідомлення та явний результат одноразової прив'язки. URL-кнопки ведуть лише на canonical `NEXTAUTH_URL` і `/docs`; бот не приймає files, passwords, email або API keys. Додано BotFather/runbook із description, about text, commands, webhook health і post-deploy перевіркою.
- **Перевірки:** Jest покриває welcome, help, unknown message, success/invalid link і allowlisted URL-кнопки; TypeScript, ESLint, Prettier, build і `git diff --check` запускаються перед merge. Browser UI не змінюється.
- **Нові змінні оточення:** немає; використовуються наявні server-only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`.

# 2026-09-08

- **Задача:** Керування Telegram-прив'язкою та безпека recovery.
- **Змінені файли:** `app/api/account/telegram/link/route.ts`, Telegram webhook/linking, `UserProfile`, `EditProfileModal`, shared `ConfirmationModal`, Jest tests, architecture/layer guides, backlog і `docs/progress.md`.
- **Результат:** Користувач може відв'язати Telegram з Dashboard або Edit Profile через знайому confirm-модалку; на mobile Change/Disconnect використовують той самий responsive action-pattern, що й сусідні блоки. Owner-scoped `DELETE /api/account/telegram/link` очищує прив'язку та pending token. Нова deep link спроба не відключає попередній підтверджений recovery channel, а webhook приймає linking token лише з private chat.
- **Перевірки:** targeted Jest покриває unlink route, збереження verified state за нового посилання, private/group webhook і Telegram UI confirm-flow; TypeScript, ESLint і `git diff --check` запускаються перед merge. Browser plugin відсутній; локальна browser-перевірка обмежена відсутністю авторизованої test session.
- **Нові змінні оточення:** немає; використовуються наявні server-only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`.

# 2026-09-08

- **Задача:** Остаточно актуалізувати документацію після cloud migration і dependency security fix.
- **Змінені файли:** `README.md`, `docs/architecture.md`, `docs/tech_saas.md`, `docs/START.md`, `docs/guides/frontend.md`, `docs/audits/dependency-security-latest.md`, новий `docs/audits/documentation-audit-2026-09-08.md` і `docs/progress.md`.
- **Результат:** README відокремлює local Compose від публічного Northflank Developer Sandbox + Supabase demo та містить посилання на cloud video/Canva presentation. Канонічні документи фіксують актуальний стек, 0 vulnerabilities після точкових Prisma-транзитивних overrides, єдиний mobile action-pattern і лише майбутній тематичний backlog. Дерево `architecture.md` повторно зіставлено з tracked files: додано account deletion, admin metrics/requests, актуальні component names, scripts і конфігурації Jest/Next/Prisma.
- **Перевірки:** Markdown links, technology/security claims і backlog зіставлено з package/lockfile, Dockerfile, Prisma, Routes, Guides і поточною cloud-конфігурацією; Prettier і `git diff --check` виконуються перед merge.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Усунути транзитивні security findings у production dependency tree.
- **Змінені файли:** `package.json`, `package-lock.json`, `docs/progress.md`.
- **Результат:** Точкові npm overrides оновлюють Prisma-транзитивні `fast-uri` до `3.1.6` і `mysql2` до `3.23.1`, не змінюючи `prisma`/`@prisma/client` `7.10.0`. `npm audit --omit=dev` і повний install-audit повертають 0 vulnerabilities.
- **Перевірки:** `npm ls` підтверджує обидві overridden версії; Prisma generate, TypeScript, повний Jest (52 suites / 159 tests), ESLint без errors, production `next build` і `git diff --check` успішні. Docker migration-target не перевірено локально: Docker Desktop daemon вимкнено.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Уніфікувати мобільну дію блоку Delete Account і нормалізувати дати журналу.
- **Змінені файли:** `components/dashboard/UserProfile.tsx`, `docs/progress.md`.
- **Результат:** На вузькому екрані дії Delete Account розташовані під описом і займають усю доступну ширину без перенесення слів; з `sm` breakpoint група повертається до рядка праворуч. Кожен блок задач за 7–8 вересня тепер має власний заголовок дати, тому журнал не об'єднує кілька задач під однією датою.
- **Перевірки:** Prettier, TypeScript, ESLint і `git diff --check` виконано перед merge.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Адаптувати дію Create key для вузьких екранів Dashboard.
- **Змінені файли:** `components/dashboard/ApiKeyManager.tsx`, його component-тест і `docs/progress.md`.
- **Результат:** На mobile опис і action розташовані вертикально; кнопка `Create key` займає повну ширину, не переносить слів і має збільшену область дотику. На `sm` і ширше збережено компактний action праворуч від опису.
- **Перевірки:** Prettier, targeted Jest (3 tests), TypeScript, ESLint і `git diff --check` успішні.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Усунути layout shift у feedback збереження File Storage.
- **Змінені файли:** `components/dashboard/PrivacySettings.tsx`, його component-тест і `docs/progress.md`.
- **Результат:** Короткий доступний статус `Saving…` розташовано ліворуч від toggle в одній горизонтальній групі, тому він не додає рядок під описом і не змінює висоту картки на desktop/mobile. Success/error toast збережені.
- **Перевірки:** Prettier, targeted Jest (3 tests), TypeScript, ESLint і `git diff --check` успішні.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Виправити GitHub Actions ESLint failure у початковому завантаженні System Monitoring.
- **Змінені файли:** `components/admin/SystemMonitoring.tsx`, `components/dashboard/__tests__/settings.test.tsx`, `docs/progress.md`.
- **Результат:** Initial metrics load тепер викликає pure `fetchMetrics` в asynchronous callback ефекту; state оновлюється після завершення promise, а retry за click зберігає явний loading/error flow. Видалено два невикористовувані параметри з нових test mocks.
- **Перевірки:** Prettier, ESLint, TypeScript, targeted Jest (5 tests) і `git diff --check` успішні.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Усунути Jest discovery warning і уніфікувати feedback асинхронних дій Dashboard/Admin.
- **Змінені файли:** `jest.config.ts`, `components/ui/Button.tsx`, `components/dashboard/PrivacySettings.tsx`, `components/dashboard/ApiKeyManager.tsx`, `components/admin/SystemMonitoring.tsx`, component-тести і `docs/progress.md`.
- **Результат:** Jest обмежено вихідними test roots і він більше не сканує `.next/standalone`. Базова кнопка отримала єдиний disabled-style. File Storage показує saving і блокує toggle, API keys показують creating/revoking/copying та виключають паралельні мутації, а System Monitoring розрізняє initial loading, error з Retry і stale metrics після невдалого refresh.
- **Перевірки:** Prettier, `git diff --check`, `npx tsc --noEmit`, ESLint, targeted Jest (5 tests) і повний Jest (52 suites / 159 tests) успішні. Browser plugin недоступний; Playwright fallback підтвердив два public Chromium flow, повний локальний прогін обмежено недоступністю Google Fonts.
- **Нові змінні оточення:** немає.

# 2026-09-08

- **Задача:** Провести повторний documentation audit і розширити практичні guides за шарами.
- **Змінені файли:** `README.md`, `docs/architecture.md`, `docs/tech_saas.md`, `docs/audits/dependency-security-latest.md`, `docs/guides/*` і `docs/progress.md`.
- **Результат:** README чітко відокремлює публічний Northflank + Supabase MVP від billing-ready production; architecture містить короткий фактичний потік видалення облікового запису. Guides доповнені єдиною політикою UI-станів і polling, server-потоками password reset/Telegram/account deletion, Prisma advisory lock і safe queries, а також порядком backup → migration job → app deploy. Оновлено стек supporting UI packages та уточнено, що `npm audit --omit=dev` виконується окремо від поточного CI workflow.
- **Перевірки:** Твердження зіставлено з `package.json`, Prisma schema, Route Handlers, `lib/**`, Docker/Compose, GitHub Actions і active backlog. `npx prettier --check` для всіх змінених Markdown-файлів і `git diff --check` успішні.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Завершити production smoke-test Telegram recovery і остаточно актуалізувати документацію.
- **Змінені файли:** `docs/backlog/README.md`, видалений `docs/backlog/050-telegram-and-account.md`, `docs/work_plan.md`, `docs/audits/documentation-audit-2026-09-07.md`, deployment/layer guides і `docs/progress.md`.
- **Результат:** У production вручну підтверджено прив'язку Telegram, запит reset за `@username`, доставку одноразового посилання до private chat, зміну пароля та повторний вхід. Telegram-задачу видалено з активного backlog за правилами проєкту; рішення збережено у Git, guides і журналі змін.
- **Перевірки:** `getWebhookInfo` підтверджує production URL без помилки; повний користувацький flow Telegram recovery успішно завершено.
- **Нові змінні оточення:** немає; використовуються наявні server-only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` лише у `convertly-app-runtime`.

# 2026-09-07

- **Задача:** Актуалізувати документацію після production-налаштування Telegram recovery.
- **Змінені файли:** `docs/backlog/050-telegram-and-account.md`, `docs/work_plan.md`, `docs/audits/documentation-audit-2026-09-07.md`, `docs/progress.md`.
- **Результат:** Зафіксовано, що migration, app deploy, `setWebhook` і прив'язку Telegram із Dashboard завершено. На момент цього запису `050` лишався в активному backlog до фінального smoke-test reset за `@username`.
- **Перевірки:** `getWebhookInfo` підтвердив production URL без помилки; ручна Telegram-прив'язка успішна. Фінальний reset за `@username` зазначено окремим наступним записом вище.
- **Нові змінні оточення:** немає; використовуються наявні server-only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` лише у `convertly-app-runtime`.

# 2026-09-07

- **Задача:** Поліпшити відображення та оновлення Telegram-прив'язки у Dashboard.
- **Змінені файли:** `components/dashboard/UserProfile.tsx`, `components/dashboard/EditProfileModal.tsx`, `components/dashboard/TelegramLinkButton.tsx`, `components/dashboard/__tests__/EditProfileModal.test.tsx`, `docs/progress.md`.
- **Результат:** У Dashboard badge `Verified` розташовано в рядку з `Connected as @username`; Edit profile показує поточний username, а широка на малому екрані та природна на desktop кнопка `Change Telegram account` не обрізає текст. Після створення deep link профіль опитується раз на 5 секунд не довше двох хвилин; у разі зміни прив'язки UI оновлюється сам і показує підтверджувальне сповіщення. Постійного polling немає.
- **Перевірки:** TypeScript, ESLint без помилок і Jest для EditProfileModal виконано. Browser-плагін недоступний; Playwright виконав два наявні guest-сценарії, але повний локальний прогін було зупинено через зависання dev-server за недоступних Google Fonts — зміну Dashboard-авторизації він не покриває.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Реалізувати відновлення пароля через підтверджений Telegram chat.
- **Змінені файли:** Prisma schema і migration `20260907170000_telegram_password_recovery`, `lib/telegram/bot.ts`, Telegram linking/webhook, recovery route/UI, Profile, Jest tests і актуальна документація.
- **Результат:** Webhook зберігає нормалізований public Telegram username лише за підтвердженої прив'язки. Password reset приймає email або `@username`, завжди відповідає нейтрально та надсилає одноразове 30-хвилинне посилання Bot API винятково до active user із підтвердженим chat ID. Username не є доказом володіння; token, reset URL, chat ID і bot token не логуються.
- **Перевірки:** Prisma validate/generate, TypeScript, ESLint, Jest (51 suites / 155 tests), Playwright (5/5) і ізольований Docker integration migration preflight виконано. Production migration, app deploy, `setWebhook`, ручну прив'язку з особистим chat і reset за `@username` виконано; підсумковий статус зафіксовано окремим записом вище.
- **Нові змінні оточення:** немає; використовуються вже підготовлені server-only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` лише у `convertly-app-runtime`.

# 2026-09-07

- **Задача:** Докладно декомпозувати наступні product/backend задачі: Telegram password recovery і admin conversion history.
- **Змінені файли:** `docs/backlog/README.md`, `docs/backlog/020-conversion-capabilities.md`, `docs/backlog/050-telegram-and-account.md`, новий `docs/backlog/060-admin-conversion-history.md`, `docs/progress.md`.
- **Результат:** Telegram backlog тепер описує поточну прив'язку, підготовку bot token/username/webhook secret, налаштування webhook і безпечний recovery flow. Conversion history винесено із загального work plan в самостійну задачу з UI, API, S3 cleanup, audit і тестовими критеріями.
- **Перевірки:** Вимоги зіставлено з наявними Telegram link/webhook route, `User` schema, `ConversionLog`, Dashboard history і System Monitoring.
- **Нові змінні оточення:** зараз немає; майбутня Telegram-задача використовує вже наявні `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`.

# 2026-09-07

- **Задача:** Актуалізувати статуси виконаних deployment-задач в історичному `work_plan.md`.
- **Змінені файли:** `docs/work_plan.md`, `docs/progress.md`.
- **Результат:** Northflank + Supabase public demo явно позначено виконаним, а Oracle, backup/restore, monitoring, CD і multi-instance rate limit збережено як окремі незавершені інфраструктурні напрями з посиланням на тематичний backlog. Виконані задачі більше не виглядають як такі, що очікують запуску.
- **Перевірки:** Статуси зіставлено з Northflank/Supabase runbook, поточним domain/SMTP/migration flow і cloud portability документом.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Провести двопрохідний audit документації, додати PowerShell API/backup-інструкції, тематичний backlog і єдиний cloud portability runbook.
- **Змінені файли:** `README.md`, `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/northflank-supabase-setup.md`, нові `docs/api-powershell.md`, `docs/supabase-logical-backup.md`, `docs/cloud-portability.md`, `docs/backlog/*`, `docs/audits/documentation-audit-2026-09-07.md`, `docs/progress.md`.
- **Результат:** Документацію синхронізовано з поточним публічним Northflank + Supabase demo. Додано повний PowerShell flow `POST → 202 → polling download`, логічний Supabase CLI backup, незалежний runbook перенесення PostgreSQL/S3/secrets/DNS між providers і єдиний активний тематичний backlog. Виконані задачі лишаються у Git і `progress.md`, тому окрема дублювальна папка `done/` не створюється.
- **Перевірки:** Markdown links, команди та змінні зіставлено з Route Handlers, `Dockerfile`, `.env*.example`, Prisma migrations і scripts; перед merge виконуються `npm run linteslint`, `npx tsc --noEmit` і Jest.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Вирівняти дії блоку Delete Account в одному рядку.
- **Змінені файли:** `components/dashboard/UserProfile.tsx`, `docs/progress.md`.
- **Результат:** На мобільному екрані група дій розміщується окремим рядком під описом, але `Request submitted` і `Cancel request` розташовані поруч і рівномірно займають доступну ширину; на desktop група лишається праворуч і не переносить текст кнопок.
- **Перевірки:** ESLint, TypeScript і Playwright виконуються до merge.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Розширити керування запитами на видалення облікового запису: пошук, пагінація, скасування та зрозумілий статус для користувача.
- **Змінені файли:** Prisma schema і migration `20260907160000_account_deletion_request_management`, account-deletion service/API, Admin Panel, Profile, Головна та документація.
- **Результат:** Admin Panel підтримує пошук за email, фільтр статусів, cursor-пагінацію, Refresh із часом останнього успішного оновлення, скасування `PENDING`/`FAILED` запитів і audit event `CANCELLED`. Користувач бачить час надсилання, може скасувати лише `PENDING` request; Profile опитує стан раз на 30 секунд. Після фактичного видалення він автоматично виходить із сесії та перенаправляється на Головну зі сповіщенням.
- **Перевірки:** Prisma validate/generate, TypeScript, ESLint, Jest, Playwright і real integration/E2E виконуються перед merge.
- **Нові змінні оточення:** немає.
- **Діагностика пошти:** надсилання support-сповіщень логує лише успішний `kind` і `requestId`; додано сповіщення `CANCELLED`.

# 2026-09-07

- **Задача:** Виправити CI lint для початкового завантаження списку запитів на видалення облікового запису.
- **Змінені файли:** `components/admin/AccountDeletionRequests.tsx`, `docs/progress.md`.
- **Результат:** Початкове завантаження списку тепер виконує fetch безпосередньо у `useEffect`, а оновлення state відбувається лише в асинхронному callback. Це усуває помилку `react-hooks/set-state-in-effect`, не змінюючи API, UI або обробку ручного Refresh.
- **Перевірки:** ESLint, TypeScript і Jest (50 suites / 149 tests) успішні.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Реалізувати кероване видалення облікового запису через запит користувача та підтвердження адміністратора.
- **Змінені файли:** Prisma schema і migration `20260907150000_account_deletion_workflow`, account-deletion service, authenticated account/admin API routes, Profile і Admin Panel UI, SMTP notifications, `.env*.example`, `docs/account-deletion-workflow.md`, `docs/db-schema.md`, Northflank guide і `README.md`.
- **Результат:** Користувач створює захищений від дублів request; активний admin бачить запит, підтверджує окремою модалкою та не може підтвердити власне видалення. Сервер спочатку видаляє всі відомі S3 conversion objects, потім User і каскадні записи. `AccountDeletionRequest` і append-only events зберігаються після видалення користувача з `userId = NULL`; у разі збою request стає `FAILED` і безпечно повторюється. Support mailbox отримує сповіщення про створення, успіх або збій, але SMTP не змінює стан видалення.
- **Перевірки:** Prisma validate/generate, TypeScript, ESLint, Jest, Playwright і real integration/E2E виконуються перед merge. Перед production migration — логічний Supabase backup, migration job, потім app deployment і ручна перевірка двома різними обліковими записами.
- **Нові змінні оточення:** `SUPPORT_EMAIL` (server-only, non-secret) — адреса моніторованого support mailbox; у Northflank додати до `convertly-app-runtime`.
- **Документація:** новий runbook `docs/account-deletion-workflow.md` і посилання на нього в `README.md` перекладено українською; англомовними лишаються лише технічні ідентифікатори, назви UI-розділів і статуси БД.

# 2026-09-07

- **Задача:** Зробити `Subscription.activePlan` єдиним джерелом істини тарифу та додати OpenSSL до Prisma migration image.
- **Змінені файли:** `prisma/schema.prisma`, migration `20260907140000_subscription_plan_source_of_truth`, billing/API/admin services, one-off plan sync, audit script, `Dockerfile`, integration/Jest tests, `docs/subscription-plan-migration.md` і пов'язані guides.
- **Результат:** Migration створює Subscription відсутнім користувачам із legacy `User.plan`, зберігає вже наявний `Subscription.activePlan` у разі розходження та видаляє legacy-колонку. Реєстрація, quota/API checks, Admin і one-off plan sync читають/змінюють лише Subscription. До migration target додано `openssl`, що усуває Prisma warning у Northflank job.
- **Перевірки:** Prisma validate/generate, TypeScript, Jest, Playwright, real integration/E2E і Docker migration-target build виконуються перед merge. Перед production migration обов'язкові логічний Supabase backup і read-only `node scripts/audit-subscription-plans.mjs`.
- **Нові змінні оточення:** немає; `PLAN_SYNC_EMAIL` і `PLAN_SYNC_ACTIVE_PLAN` лишаються лише run-time overrides one-off job.

# 2026-09-07

- **Задача:** Видалити legacy-схему скасованої Guest support code feature.
- **Змінені файли:** `prisma/schema.prisma`, migration `20260907130000_remove_guest_support_code`, `docs/db-schema.md`, `docs/guides/database.md`, `docs/progress.md`.
- **Результат:** Нова Prisma migration спочатку видаляє unique index `GuestConversionQuota_supportCodeHash_key`, потім nullable-колонку `supportCodeHash`. Застосована migration додавання не редагується.
- **Перевірки:** Prisma validate/generate, lint, TypeScript, Jest і migration SQL review виконуються до merge. Production migration запускається лише після backup Supabase.
- **Нові змінні оточення:** немає.

# 2026-09-07

- **Задача:** Скасувати Guest support code та обмежений reset job.
- **Змінені файли:** guest UI/API, reset scripts, конфігурація, тести та документація.
- **Результат:** Функцію видалено із застосунку зворотними Git revert-змінами. Уже застосовані migration `20260904130000_guest_support_code`, nullable поле `supportCodeHash` та його індекс навмисно збережені як legacy-стан до окремої задачі очищення БД.
- **Перевірки:** lint, TypeScript, Jest і Playwright виконуються перед merge.
- **Нові змінні оточення:** немає.

# 2026-09-04

- **Задача:** Додати окремий runbook для вимкнення або повного видалення Guest support code.
- **Змінені файли:** `docs/guest-support-code-removal.md`, `README.md`, `docs/progress.md`.
- **Результат:** Документовано зворотне cloud-вимкнення без міграції та окремий безпечний шлях повного видалення через нову Prisma migration; застосовану production migration змінювати заборонено.
- **Перевірки:** Markdown-посилання та команди зіставлено з поточними файлами, job і Northflank-конфігурацією.

# 2026-09-04

- **Задача:** Виправити CI lint для one-off guest quota reset.
- **Змінені файли:** `scripts/guest-quota-reset-core.mjs`,
  `scripts/reset-guest-quota.mjs`, його Jest-тест, `Dockerfile`, migration-image
  test і `docs/progress.md`.
- **Результат:** core reset-логіку переведено з CommonJS на ESM. Тому
  `@typescript-eslint/no-require-imports` більше не зупиняє GitHub Actions;
  public command і поведінка Northflank job не змінюються.
- **Перевірки:** цільовий Jest (2 suites / 5 tests), ESLint, TypeScript, Prettier
  і `git diff --check` — успішні.
- **Нові змінні оточення:** немає.

# 2026-09-04

- **Задача:** Додати Guest support code та обмежений one-off reset гостьової квоти.
- **Змінені файли:** `app/api/guest/conversions/route.ts`, `app/page.tsx`,
  `components/core/GuestConversionSummary.tsx`, `lib/guest/support-code.ts`,
  `prisma/schema.prisma`, migration `20260904130000_guest_support_code`,
  `scripts/reset-guest-quota.mjs`, `scripts/guest-quota-reset-core.cjs`,
  `Dockerfile`, `.env*.example`, документація та нові Jest-тести.
- **Результат:** Після першої guest-конвертації UI показує місячний
  `GUEST-…` code і дозволяє скопіювати його. Code детерміновано створюється
  server-side як HMAC visitor-cookie та поточного місяця; у PostgreSQL зберігається
  лише SHA-256-хеш. Ручний `admin:reset-guest-quota`/Northflank migration job
  приймає code лише як run-only variable, знаходить рівно одну quota row і
  атомарно обнуляє image/document counters без публічного reset endpoint.
- **Перевірки:** цільові Jest, Prisma validate/generate, TypeScript, ESLint,
  Prettier і Playwright desktop/mobile visual QA виконуються перед фінальним
  комітом.
- **Нові змінні оточення:** server-only `GUEST_SUPPORT_CODE_SECRET` у app
  runtime; run-only `GUEST_SUPPORT_CODE` для manual reset job.

# 2026-09-04

- **Задача:** Виправити migration Docker image для one-off plan sync.
- **Змінені файли:** `Dockerfile`, `docs/progress.md`.
- **Результат:** stage `migration` тепер отримує як entry script
  `sync-user-plan.mjs`, так і його CJS dependency `plan-sync-core.cjs`.
  Раніше image копіював лише seed-first-admin script, тому Northflank job
  завершувався `MODULE_NOT_FOUND` до підключення до бази.
- **Перевірки:** Docker target `migration` build/file preflight, TypeScript,
  ESLint, Jest і Prettier виконуються перед фінальним комітом.
- **Нові змінні оточення:** не додавалися.

# 2026-09-04

- **Задача:** Виправити lint-сумісність Jest-тесту one-off plan sync.
- **Змінені файли:** `scripts/__tests__/plan-sync-core.test.js`,
  `docs/progress.md`.
- **Результат:** CommonJS `require()` у тесті замінено на ES import, тому
  `@typescript-eslint/no-require-imports` більше не зупиняє GitHub Actions.
- **Перевірки:** цільовий Jest, ESLint, TypeScript і Prettier виконуються перед
  фінальним комітом.
- **Нові змінні оточення:** не додавалися.

# 2026-09-04

- **Задача:** Додати безпечний one-off sync тарифу тестового користувача.
- **Змінені файли:** `scripts/sync-user-plan.mjs`,
  `scripts/plan-sync-core.cjs`, его Jest-тест, `package.json`,
  `docs/northflank-supabase-setup.md`, `docs/db-schema.md`,
  `docs/architecture.md`, `docs/work_plan.md`, `README.md`, `docs/progress.md`.
- **Результат:** оператор передає `PLAN_SYNC_EMAIL` і
  `PLAN_SYNC_ACTIVE_PLAN` лише поточному manual job run. Скрипт валідує
  email і рівно чотири тарифні значення, не створює невідомого користувача
  та однією Prisma transaction синхронізує `User.plan` із
  `Subscription.activePlan`, очищуючи старий Mock Checkout request. Для
  Northflank Sandbox описано безпечне повторне використання migration job без
  створення третього постійного job.
- **Перевірки:** Jest для валідації, unknown user і атомарної синхронізації,
  TypeScript, ESLint і Prettier виконуються перед фінальним комітом.
- **Нові змінні оточення:** run-only `PLAN_SYNC_EMAIL` і
  `PLAN_SYNC_ACTIVE_PLAN`; вони не додаються до `.env`, app service або
  persistent secret group.

# 2026-09-04

- **Задача:** Усунути мінімальні browser warnings: відсутній `robots.txt`
  і autocomplete-підказки Dashboard.
- **Змінені файли:** `app/robots.ts`, його Jest-тест, `components/ui/Search.tsx`,
  component-тест, `components/dashboard/EditProfileModal.tsx`, `e2e/critical-flows.spec.ts`,
  `docs/architecture.md`, `docs/progress.md`.
- **Результат:** Next.js file-based metadata route тепер повертає `GET /robots.txt`
  замість `404`. Поле пошуку явно вимикає недоречне browser autofill, а Name і
  Email у profile modal використовують семантичні `name`/`email` autocomplete tokens.
  Console перевіряється Playwright у чистому Chromium-профілі: browser extensions туди
  не завантажуються, тому помилки `extension_content.js` не належать до застосунку.
  Pricing E2E очікує фактичну відповідь NextAuth session до вибору тарифу, усуваючи
  race між client hydration і переходом неавторизованого користувача.
- **Перевірки:** цільові Jest, TypeScript, ESLint, critical Playwright flows і
  окрема перевірка console/`/robots.txt` виконуються перед фінальним комітом.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Уніфікувати вертикальні відступи всіх сторінок застосунку.
- **Змінені файли:** `app/globals.css`, root, auth, dashboard, pricing,
  documentation і `not-found` pages/layouts, `docs/progress.md`.
- **Результат:** застосовано єдиний набір Tailwind-класів `py-12 sm:py-16`
  (`48px` / `64px`) для верхнього та нижнього відступів. Короткі сторінки лишаються центрованими за
  висотою main без зайвого прокручування; головна, Dashboard, Admin, Pricing і Docs
  використовують однаковий вертикальний ритм, коли контент прокручується.
- **Перевірки:** TypeScript, ESLint і Playwright critical flows виконуються перед
  фінальним комітом; desktop/mobile visual QA виконано локально.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Виправити `InvalidKey` під час збереження авторизованої конвертації
  у Supabase Storage.
- **Змінені файли:** `lib/privacy/conversion-results.ts`,
  `lib/privacy/__tests__/conversion-results.test.ts`, `docs/progress.md`.
- **Результат:** S3 object key більше не містить користувацьку назву файлу та
  URI-кодовані символи. Новий ключ має стабільну форму
  `users/<userId>/conversions/<conversionId>/result.<extension>`; завантажувана
  назва й далі читається з `ConversionLog.resultFileName`. Раніше збережені
  результати лишаються доступними, оскільки їхні попередні ключі вже зберігаються у БД.
- **Перевірки:** цільові Jest-тести виконуються перед фінальним комітом.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Виправити діагностику фонової stored-конвертації DOCX у cloud
  runtime.
- **Змінені файли:** `lib/core/conversion-job.ts`,
  `app/api/account/conversions/[conversionId]/download/route.ts`, їхні Jest-тести,
  `docs/progress.md`.
- **Результат:** сервер фіксує безпечний етап невдалого job (`conversion`,
  резервування storage, S3 upload або запис completed-state) з технічним
  кодом/HTTP status/request ID, але не пише до логів назву файлу, вміст,
  credentials або текст вихідної помилки. Download polling тепер повертає
  controlled `422` з уже безпечним user-facing message для `FAILED`, замість
  неправильного `404 Stored conversion not found` після завершення job.
- **Перевірки:** цільові Jest-тести виконуються перед фінальним комітом.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Попередній performance-аудит cloud DOCX → PDF.
- **Змінені файли:** `docs/audits/web-performance-audit-latest.md`,
  `docs/audits/web-performance-audit-2026-09-03T18-19-26-248Z.md`,
  `docs/progress.md`.
- **Результат:** зафіксовано виміряний health response, 30-секундний
  server-side timeout Gotenberg і ризики capacity для LibreOffice на demo-tier.
  Gotenberg logs підтвердили LibreOffice cold-start timeout до warm-up; після
  прогріву той самий DOCX обробляється за 6–8 секунд. Окремо підтверджено
  storage failure авторизованого run: Gotenberg повернув PDF 200, але запис
  завершився `FAILED` із `storageKey=NULL` до S3 result persistence.
- **Перевірки:** external `GET /api/health` — HTTP 200 за `0.926 s`; вихідний
  код і deployment configuration проаналізовано. Вихідний код не змінювався.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Додати безпечну діагностику доставки authentication email у
  cloud runtime.
- **Змінені файли:** `lib/mail/send-auth-email.ts`,
  `docs/northflank-supabase-setup.md`, `docs/progress.md`.
- **Результат:** помилки Nodemailer тепер фіксуються сервером один раз для
  verification і password-reset листів із безпечними технічними ознаками:
  тип листа, ім'я помилки, SMTP code/command і response code. До логу не потрапляють
  SMTP password, email одержувача, текст листа, токен або одноразове посилання.
  Це дозволяє діагностувати cloud `503` без послаблення privacy.
- **Перевірки:** Jest: 2/2 цільових test suites; TypeScript, ESLint і production
  build успішні.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Виправити перший Northflank build public Next.js service.
- **Змінені файли:** `Dockerfile`, `docs/progress.md`.
- **Результат:** видалено `COPY --from=builder /app/public ./public`: папка
  `public/` порожня й не відстежується Git, тому відсутня у віддаленому
  Docker build context і зупиняла build після успішних Prisma/Next steps.
  Runtime image і далі отримує standalone server і `.next/static`.
- **Перевірки:** перший `npm run build` успішно завершив compilation і
  TypeScript; локальний `docker build` не запущено, оскільки Docker Desktop daemon
  вимкнений. Повторний Next build заблоковано stale `.next`/OneDrive `EPERM`;
  це не стосується Dockerfile та буде перевірено наступним Northflank build.
- **Нові змінні оточення:** не додавалися.

# 2026-09-03

- **Задача:** Додати покрокову інструкцію першого запуску demo MVP на
  Northflank + Supabase.
- **Змінені файли:** `docs/northflank-supabase-setup.md`,
  `docs/northflank-supabase-demo.md`, `README.md`, `docs/work_plan.md`,
  `docs/progress.md`.
- **Результат:** концептуальний runbook відокремлено від практичного guide. Новий
  файл проводить через реєстрацію та MFA, обмежений GitHub-доступ,
  Supabase PostgreSQL/S3, private Gotenberg, Northflank secret groups,
  migration/seed jobs, custom domain, SMTP, health/smoke-tests, deploy після
  звичайного commit і commit із Prisma migration, rollback та діагностику.
- **Уточнення під час першого живого проходження:** guide фіксує, що `APP_DOMAIN`
  не потрібен Northflank runtime, перший job/service потребує окремого Start build
  до Run, а Supabase Free може обмежувати Storage до 50 MB.
- **Перевірки:** Markdown-посилання та Prettier перевірено; runtime, cloud accounts,
  DNS і secrets не змінювалися.
- **Нові змінні оточення:** не додавалися.

# 2026-09-02

- **Задача:** Підготувати функціональний public demo MVP на Northflank Free +
  Supabase Free без створення хмарних ресурсів.
- **Змінені файли:** `docs/northflank-supabase-demo.md`, `README.md`,
  `docs/architecture.md`, `docs/tech_saas.md`, `docs/local-start.md`,
  `docs/work_plan.md`, `.env.example`, `.env.production.example`,
  `lib/storage/s3.ts`, `lib/storage/__tests__/s3.test.ts`, `docs/progress.md`.
- **Результат:** підготовлено незалежний runbook: public Next.js і private
  Gotenberg займають два Northflank services, PostgreSQL і private
  S3-compatible Storage розташовані в одному Supabase project. Явно описано
  Dockerfile path/build context `/convertly-hub` для GitHub repository з
  кількома проєктами, secret groups, migrations, SMTP, domain, rollback та
  обмеження Free demo. Storage-layer приймає `S3_REGION`, тому той самий
  AWS SDK код працює з локальним MinIO, Oracle MinIO й Supabase S3 API.
- **Перевірки:** цільовий Jest (6 tests), TypeScript, ESLint і
  `npm audit --omit=dev` успішні; хмарні облікові записи, DNS і secrets не змінювалися.
- **Нові змінні оточення:** `S3_REGION` (server-only; default
  `us-east-1`, для Supabase задається фактичний регіон project).

# 2026-09-02

- **Задача:** Створити докладні посібники за шарами застосунку.
- **Змінені файли:** `docs/guides/README.md`, `docs/guides/frontend.md`,
  `docs/guides/backend.md`, `docs/guides/database.md`,
  `docs/guides/testing-and-operations.md`, `README.md`, `docs/architecture.md`,
  `docs/progress.md`.
- **Результат:** додано окремий розділ із розбором реальних файлів і ланцюжків
  виконання frontend, backend/server, PostgreSQL/Prisma та тестів/операцій.
  Приклади охоплюють Dropzone → Route Handler → Core → storage → history,
  HttpOnly auth, квоти, state machine `ConversionLog`, міграції та CI.
- **Перевірки:** Markdown/посилання та форматування перевіряються перед фінальним
  комітом; runtime і secrets не змінювалися.
- **Нові змінні оточення:** не додавалися.

# 2026-09-02

- **Задача:** Підготувати альтернативні cloud deployment runbook-плани та
  актуалізувати технологічну документацію.
- **Змінені файли:** `docs/vercel-production-deployment.md`,
  `docs/render-production-deployment.md`, `docs/tech_saas.md`,
  `docs/architecture.md`, `docs/work_plan.md`, `README.md`, `docs/progress.md`.
- **Результат:** застаріле ТЗ `tech_saas.md` замінено актуальною картою
  реалізованого MVP, оточень і production-меж. Створено незалежні плани:
  Vercel Pro (managed PostgreSQL/S3 і закритий worker) та Render Paid / Free demo.
  Зафіксовано, що Render Free + MailHog не підходить для повного public MVP;
  Oracle A1 лишається кращим single-server варіантом.
- **Перевірки:** Markdown/посилання та форматування перевіряються перед фінальним
  комітом; runtime, Docker, хмарні облікові записи та secrets не змінювалися.
- **Нові змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Підготовка production-розгортання на Oracle Cloud Free Tier.
- **Змінені файли:** `Dockerfile`, `.dockerignore`,
  `docker-compose.production.yml`, `deploy/Caddyfile`,
  `.env.production.example`, `README.md`, `docs/oracle-production-deployment.md`,
  `docs/architecture.md`, `docs/local-start.md`, `docs/START.md`,
  `docs/work_plan.md`.
- **Результат:** підготовлено окремий ARM64-compatible production-контур для
  Oracle A1: Next.js standalone, private PostgreSQL/MinIO/Gotenberg, Caddy з
  автоматичним HTTPS, окремий шаблон production-секретів, ручні безпечні
  міграції та створення першого адміністратора. Runbook описує DNS, firewall,
  SMTP, ARM64 preflight, запуск, оновлення, smoke-tests і обов'язковий off-host
  backup.
- **Перевірки:** повний `docker compose --env-file .env.production.example
--profile maintenance ... config`, TypeScript, ESLint, Prettier, `npm audit` и
  Jest (44 suites / 134 tests) успішні. Локальний `npm run build` зупинено
  зовнішньою недоступністю `fonts.googleapis.com`; невдало завершений
  integration-runner було одразу очищено й він не зачепив основний Compose-стек.
- **Нові змінні оточення:** production-шаблон документує `APP_DOMAIN`,
  `SMTP_USER` і `SMTP_PASSWORD`; інші значення використовують уже наявні
  server-only змінні з production internal hostnames.

# 2026-09-01

- **Задача:** Додати публічний контакт підтримки у футер.
- **Опис:** До футера додано доступне посилання `mailto:support@bon.kharkov.ua`.
  Copyright і контакт є самостійними нерозривними елементами flex-wrap:
  на desktop вони стоять у рядку, на mobile переносяться цілими смисловими блоками.
- **Змінені файли:** `components/core/Footer.tsx`, його component-тест і
  `docs/progress.md`.
- **Перевірки:** цільовий Jest-тест, TypeScript, ESLint і desktop/mobile Playwright
  перевірка виконуються перед фінальним комітом.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Відновити строгу установку залежностей у GitHub Actions.
- **Опис:** Додано вузький `overrides.next-auth.nodemailer = "$nodemailer"`.
  Він пов'язує optional peer NextAuth v4 з уже перевіреним кореневим Nodemailer 9.1.0,
  тому CI зберігає `npm ci` без `--force` і `--legacy-peer-deps`.
- **Перевірки:** `npm ci --dry-run --ignore-scripts` успішно; `npm audit --omit=dev`
  — 0 vulnerabilities.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Завершити адресне оновлення production-залежностей.
- **Опис:** Nodemailer оновлено з `7.0.13` до `9.1.0` без `npm audit fix --force`.
  NextAuth лишається на стабільній v4 та використовується лише з Credentials Provider;
  вихідні verification/reset-листи надсилає власний SMTP-модуль. Реальний
  integration/E2E тепер підтверджує доставку verification email до MailHog.
- **Змінені файли:** `package.json`, `package-lock.json`, `eslint.config.mjs`,
  `e2e/backend-integration.spec.ts`, dependency-security audit, `README.md`,
  `docs/integration-tests.md` и `docs/work_plan.md`.
- **Перевірки:** `npm audit --omit=dev` — 0 vulnerabilities; TypeScript, ESLint, Jest,
  Playwright E2E та integration/E2E — успішно.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Адресне оновлення вразливих production-залежностей.
- **Змінені файли:** `package.json`, `package-lock.json`,
  `docs/audits/dependency-security-2026-09-01.md`,
  `docs/audits/dependency-security-latest.md`, `README.md`, `docs/work_plan.md`.
- **Результат:** Prisma CLI/Client/adapter-pg оновлено `7.9.1 → 7.10.0`; override
  `deepmerge-ts@8.0.0` усунув Prisma advisory. Production audit скорочено з п'яти
  finding (4 high, 1 moderate) до двох (1 high, 1 moderate) у ланцюжку
  NextAuth v4/Nodemailer 7. Примусовий перехід на Nodemailer 9 і Auth.js v5 beta
  навмисно не виконано; умови безпечної майбутньої міграції зафіксовано.
- **Перевірки:** Prisma generate/validate/migrate status, Jest, browser E2E (5/5),
  real integration/E2E (1/1), TypeScript, ESLint і Prettier пройшли. Локальний build
  блокується мережевим доступом до Google Fonts; production build уже проходить у CI.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Виправлення ізоляції Playwright jobs у GitHub Actions.
- **Змінені файли:** `playwright.config.ts`, `docker-compose.integration.yml`,
  `e2e/backend-integration.spec.ts`, `docs/integration-tests.md`.
- **Результат:** browser Playwright не запускає real integration spec; Gotenberg
  більше не блокує CI хибним Docker healthcheck, а integration spec очікує
  реальну готовність `/api/health` до 60 секунд.
- **Перевірки:** Prettier, `npx tsc --noEmit`, ESLint, `npm run test:e2e` (5/5)
  і `npm run test:integration` (1/1) пройшли. Локальний `npm run build` зупинено
  недоступністю `fonts.googleapis.com`; production build уже успішно пройшов у
  GitHub Actions job `Lint, types and Jest`.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Повторна звірка розділу «Структура папок проєкту».
- **Змінені файли:** `docs/architecture.md`.
- **Результат:** дерево відображає guest/mail/client-модулі, profile/password/email
  account API, обидва Playwright config, integration runner й окремий test Compose.
- **Перевірки:** розділ зіставлено з фактичними відстежуваними файлами проєкту.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Звірка документації після додавання реальних backend integration/E2E.
- **Змінені файли:** `README.md`, `docs/local-start.md`, `docs/START.md`,
  `docs/architecture.md`, `docs/e2e_test_plan.md`, `docs/integration-tests.md`.
- **Результат:** документація більше не відносить реальний integration/E2E-набір до
  майбутніх робіт; додано єдину команду запуску, межі покриття CI та
  пояснення діагностичного каталогу Playwright `test-results/`.
- **Перевірки:** зіставлено package scripts, обидва Playwright config, integration runner,
  Compose-файл і workflow GitHub Actions; користувач підтвердив успішний
  `npm run test:integration`.
- **Змінні оточення:** не додавалися.

# 2026-09-01

- **Задача:** Реальні backend integration/E2E-тести.
- **Змінені файли:** test Compose, Playwright config/spec, runner, CI і
  `docs/integration-tests.md`.
- **Результат:** додано ізольований контур PostgreSQL, MinIO, Gotenberg і
  MailHog; CI запускає його окремою job без зміни наявних Jest/Playwright jobs.
- **Перевірки:** `npm run test:integration` — 1 passed.
- **Уточнення:** локальна команда сама керує лише `convertly-integration`;
  CI передає прапорець керування сервісами workflow.
- **Змінні оточення:** використовуються лише test-only значення всередині runner.

# 2026-08-31

- **Задача:** Збереження звіту Web Performance і доповнення локального skill.
- **Змінені файли:** `.codex/skills/web-performance/SKILL.md`,
  `docs/audits/web-performance-audit-2026-08-31T16-44-57-000Z.md`,
  `docs/audits/web-performance-audit-latest.md`.
- **Результат:** skill містить тригери, приклади виклику, порядок відтворюваного
  аудиту та обов'язкове створення актуальної й timestamp-копії звіту.
- **Перевірки:** локальні HTTP- і Playwright-вимірювання, `GET /api/health` — healthy.
- **Змінні оточення:** не додавалися.

## 2026-08-31

- **Задача:** Додавання локального skill Web Performance.
- **Опис:** До `.codex/skills/web-performance/SKILL.md` додано WebPerf-Agent для аудиту Core Web Vitals, мережі, сервера та БД з обов'язковими Diagnostic Matrix і Action Plan. Skill зареєстровано у `AGENTS.md`; службовий файл `__MACOSX` з архіву навмисно не додано.
- **Перевірки:** Звірку вмісту ZIP і розташування skill виконано.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** GitHub Actions CI для Convertly Hub.
- **Опис:** Додано root-level workflow `.github/workflows/ci.yml`, що спрацьовує за push до будь-якої гілки, якщо змінено `convertly-hub/**` або сам workflow. Усі кроки виконуються з `convertly-hub`; інші проєкти в репозиторії не встановлюють залежності та не запускають перевірки. CI виконує ESLint, TypeScript, повний Jest і Playwright Chromium в окремій job; для Prisma/маршрутів запущено ізольований PostgreSQL і застосовуються міграції. У разі E2E-помилки зберігаються Playwright artifacts. Playwright web server використовує пряму надійну команду `npx next dev`, а не npm-передавання прапорців.
- **Перевірки:** Prettier YAML, TypeScript, цільові Jest-тести та Playwright critical flows виконано успішно. Локальний production build зупинено зовнішнім sandbox-обмеженням доступу до `fonts.googleapis.com` для `next/font`; GitHub runner виконує build зі звичайним мережевим доступом.
- **Нові змінні оточення:** Немає; CI використовує лише тестові значення, задані у workflow.

## 2026-08-31

- **Задача:** Синхронізація API-ключів і активного тарифу у Dashboard/Admin.
- **Опис:** `GET /api/account/api-keys` повертає лише активні ключі (`revokedAt: null`), тому відкликання з Admin одразу зникає і з кабінету власника. User Management відображає `Subscription.activePlan`, а `User.plan` використовує лише як fallback для legacy-записів без Subscription. До плану додано окрему виконувану задачу щодо admin-історії конвертацій, фільтра failed та безпечного керування результатами.
- **Перевірки:** Додано service-тести фільтра активних ключів і пріоритету Subscription plan; повний набір буде виконано перед комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Ієрархія Admin Panel і підтвердження адміністративних дій.
- **Опис:** Заголовок `User Management` розташований на одному рівні з `System Monitoring`; картка містить лише кількість користувачів і пошук. Пошук Conversion History вирівняно праворуч і він використовує ту саму ширину, що й пошук користувачів. Suspend/Activate і Revoke API key тепер потребують явного підтвердження у модальному вікні до API-виклику.
- **Перевірки:** Цільові component-тести (10/10) і TypeScript виконано успішно. Jest завершено з `--forceExit` через наявні відкриті async handles після проходження тестів.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Уніфікація списків Conversion History і User Management.
- **Опис:** Обидві таблиці використовують спільний доступний живий пошук з іконкою лупи, хрестиком очищення та debounce 300 мс. Винесено спільний cursor-pagination UI з `Previous`, `Page X of Y`, `Next`. В Admin прибрано дубльований заголовок User Management, кількість користувачів залишається під єдиним заголовком, а пошук розташовано праворуч; дія Suspend використовує темний primary-стиль.
- **Перевірки:** Цільові component-тести (9/9), TypeScript і ESLint виконано успішно. Browser plugin недоступний у цій сесії; фактична візуальна перевірка авторизованих Dashboard/Admin залишається після merge.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Синхронізація публічної API Documentation.
- **Опис:** Сторінка `/docs` тепер описує активний тарифний ліміт розміру, rate limit, розділення `202` stored і `200` streamed-режимів, а також захищене завантаження за `conversionId`; приклад не змішує HTTP-заголовки з бінарним файлом.
- **Перевірки:** `npm run audit:api`, TypeScript, ESLint зміненої сторінки та `git diff --check` виконано перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Прозорість гостьової конвертації.
- **Опис:** Головна сторінка показує залишки окремих guest-квот, дату місячного скидання та список результатів. Назву доступного файлу можна натискати протягом 10 хвилин; потім бінарний результат видаляється з IndexedDB, а назва залишається з `Unavailable — download window expired.` Бінарні дані не потрапляють до S3, PostgreSQL або Dashboard.
- **Перевірки:** Route/component-тести, TypeScript, ESLint змінених файлів і `git diff --check` виконано перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Актуалізація критичних Playwright flows.
- **Опис:** Playwright використовує канонічний `localhost` origin, що збігається з `NEXTAUTH_URL`, тому SessionProvider не зависає на cross-origin session-запиті. E2E-тест головної очікує завершення перевірки сесії замість фіксованої паузи; форма входу використовує role-локатори, що не конфліктують із кнопкою показу пароля; вибір тарифу прив'язано до region `Pro`, а не до крихкого порядкового номера кнопки.
- **Перевірки:** `npm run test:e2e -- e2e/critical-flows.spec.ts`, ESLint зміненого spec і `git diff --check` виконано перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Очищення пошуку Conversion History.
- **Опис:** У полі пошуку з'явився доступний хрестик: він очищує введену й уже застосовану умову, повертаючи першу сторінку поточного billing-місяця.
- **Перевірки:** Component-тест, TypeScript, ESLint змінених файлів і `git diff --check` виконано перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Пошук, сортування та лічильник сторінок Conversion History.
- **Опис:** Історія поточного billing-місяця шукає назву вихідного файлу server-side; заголовки таблиці перемикають безпечне allowlist-сортування. API повертає загальну кількість знайдених рядків, а Dashboard показує `Page X of Y`.
- **Архітектурне рішення:** Адміністративна історія конвертацій буде окремим `ADMIN`-контейнером та API. Після її появи спільні search/sort/pagination і таблицю буде виділено через композицію; масовий вибір і видалення не потраплять до користувацького компонента.
- **Перевірки:** TypeScript, route/component-тести, ESLint змінених файлів і `git diff --check` виконано перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Cursor-пагінація Conversion History.
- **Опис:** Історія Dashboard поточного календарного billing-місяця завантажується сторінками по 10 рядків через `GET /api/account/conversions`; кнопки Previous/Next використовують cursor наступної сторінки, без `OFFSET` і без завантаження всього журналу до браузера.
- **Перевірки:** TypeScript, route/component-тести, ESLint змінених файлів і `git diff --check` виконуються перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Повторне використання доступного результату конвертації.
- **Опис:** Browser-конвертація зберігає nullable SHA-256 хеш вихідного вмісту. У разі повторного завантаження ідентичного файлу з тим самим цільовим форматом сервер знаходить лише не прострочений збережений результат поточного користувача, не створює задачу та не витрачає квоту. UI повідомляє про це англійською і надає посилання `Open Dashboard`; збіг лише за назвою або розміром навмисно не використовується, щоб виключити хибні спрацьовування.
- **Міграція:** Додано, але не застосовано: `20260831110000_conversion_result_reuse`. Після merge застосуйте `npx prisma migrate deploy`, а потім `npx prisma generate`.
- **Перевірки:** TypeScript, route/service/component-тести, ESLint змінених файлів і `git diff --check` виконуються перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Автоматичне повернення upload-інтерфейсу після конвертації.
- **Опис:** Після успішного автоматичного завантаження dropzone залишається у стані результату п'ять секунд, блокуючи повторний вибір файлу, а потім самостійно повертається до завантаження. Файл залишається доступним у Conversion History в межах retention-періоду.
- **Перевірки:** TypeScript, цільові component-тести, ESLint зміненого компонента і `git diff --check` виконано перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Захист від повторного завантаження та завантаження з історії конвертацій.
- **Опис:** Під час оброблення `FileDropzone` більше не приймає другий файл; додатковий guard захищає від майже одночасних подій. Завершені й не прострочені результати у Conversion History завантажуються натисканням на назву через авторизований API-маршрут, а прострочені залишаються звичайним текстом. У колонці Conversion тепер показано обидва формати, наприклад `JPG → PNG`.
- **Перевірки:** TypeScript, цільові Jest-тести та ESLint змінених файлів виконано; ESLint повідомляє лише про наявні попередження design-tokens/Tailwind, без помилок.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Зворотний зв'язок захисту профілю та поля reset-пароля.
- **Опис:** Edit profile пояснює потребу в Current Password для зміни email/пароля та виділяє поле з помилкою до надсилання запиту. Сторінка встановлення нового пароля повторно використовує доступні поля з перемикачами видимості.
- **Перевірки:** TypeScript, ESLint змінених файлів і `git diff --check` виконано успішно; ESLint видає лише наявні попередження для design-tokens.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Усунення UX-помилки зміни email у профілі.
- **Опис:** Модальне вікно Edit profile тепер до надсилання вимагає Current Password для зміни email або пароля та очищується при повторному відкритті. Кнопки підтвердження email, Edit і Delete Account знову мають єдиний розмір на desktop.
- **Перевірки:** TypeScript, ESLint змінених компонентів і `git diff --check` виконано успішно.
- **Нові змінні оточення:** Немає.

## 2026-08-31

- **Задача:** Безпечне керування даними профілю.
- **Опис:** Додано pending-підтвердження нового email з перевіркою поточного пароля, зміну пароля з Dashboard і повторне одноразове прив'язування Telegram. Старий email залишається робочим, доки новий не підтверджено; Delete Account, як і раніше, є явним зверненням до адміністратора, а не видаленням даних.
- **Перевірки:** Prisma Client generate, TypeScript, ESLint і цільові тести виконуються перед фінальним комітом. Нову міграцію не застосовано до БД.
- **Нові змінні оточення:** Немає.

## 2026-08-26

- **Задача:** Уточнення другорядних дій профілю.
- **Опис:** Кнопки підключення Telegram і підтвердження email використовують світлий `secondary`-варіант; посилання відновлення пароля не переноситься на другий рядок. Зміна email залишається окремим майбутнім підтвердженим flow, а не частиною модальної зміни імені.
- **Перевірки:** Перевірка TypeScript, ESLint і diff виконується перед фінальним комітом.
- **Нові змінні оточення:** Немає.

## 2026-08-26

- **Задача:** Відновлення дій профілю та уточнення password reset.
- **Опис:** Dashboard знову показує статуси email/Telegram, повторне надсилання email verification, модальне редагування імені, посилання відновлення пароля та чесну дію видалення через адміністратора. Поле password reset перевіряє email або Telegram handle, що починається з `@`; reset-інструкції через Telegram навмисно не імітуються, бо у БД поки немає username і бот не вміє доставляти такі повідомлення.
- **Перевірки:** `npx tsc --noEmit`, ESLint і перевірку diff виконано успішно; наявні тести не змінювалися згідно з правилом проєкту.
- **Нові змінні оточення:** Немає.

## 2026-08-26

- **Задача:** Виправлення локального auth-flow і UX форм.
- **Опис:** Email verification тепер надсилається автоматично після успішної реєстрації, але недоступність SMTP не скасовує створений акаунт: Dashboard зберігає повторне надсилання. До login/register додано доступні кнопки показу/приховування пароля; реєстрація показує вимоги `12–128` символів до submit. `local-start.md` використовує надійну для поточного npm-середовища команду `npx next dev -p 3001`, пояснює MinIO health/login і показує очікуваний JSON health API.
- **Перевірки:** Додано route/component-тести надсилання verification-листа, безпечного fallback і password UX; запуск виконується перед фінальним комітом.
- **Нові змінні оточення:** Немає; `NEXTAUTH_URL` має збігатися з фактичним origin Next.js (`http://localhost:3001` локально).

## 2026-08-26

- **Задача:** Уточнення preflight-інструкції локального запуску.
- **Опис:** `docs/local-start.md` тепер окремо описує безпечне доповнення вже наявного `.env` блоком Gotenberg/MailHog без перезаписування секретів. Зафіксовано різницю між запущеним Docker Desktop і зупиненими Compose-контейнерами, а `docs/START.md` синхронізовано з міграцією `20260826120000_quota_reservations`.
- **Перевірки:** Звірка шаблону `.env.example`, Docker Compose і посилань документації; зміни лише документаційні.
- **Нові змінні оточення:** Немає; задокументовано вже наявні локальні змінні.

## 2026-08-26

- **Задача:** Стабілізація локального MVP: квоти, регресії та якість коду.
- **Опис:** Додано `GET /api/guest/conversions` для гідратації фактичної гостьової квоти після reload. Guest-квота тепер резервується атомарним `updateMany`; користувацькі місячні слоти та storage резервуються короткими PostgreSQL advisory-lock транзакціями. Додано міграцію `20260826120000_quota_reservations`; S3/Gotenberg залишаються поза транзакціями. Виправлено застарілий Playwright flow, Markdown-посилання та всі попередні ESLint errors.
- **Перевірки:** `npx prisma format`, `npx prisma generate`, `npx tsc --noEmit`, повний Jest (39 suites / 106 tests), ESLint, Playwright (5/5) і production build виконано успішно.
- **Нові змінні оточення:** Немає.

## 2026-08-26

- **Задача:** План стабілізації після повторного аудиту MVP.
- **Опис:** До `work_plan.md` додано пріоритетні задачі: спочатку усунення розбіжностей guest UX, атомарність квот, E2E/documentation regressions і всі ESLint errors; потім контрольоване оновлення production-залежностей з відомими audit findings. Реальні backend integration/E2E перенесено на наступний пріоритет.
- **Перевірки аудиту:** Jest — 38 suites / 104 tests; production build і Prisma validate успішні; Playwright — 4/5 через застарілий Mock Checkout test; `npm audit --omit=dev` — 5 findings.

## 2026-08-26

- **Задача:** Локальний запуск і актуальна документація.
- **Опис:** Додано безпечний `.env.example` і канонічний `docs/local-start.md` з повним шляхом від preflight Docker до першого адміністратора. `NEXTAUTH_URL` став єдиним публічним origin для NextAuth і email-посилань; внутрішні Docker-адреси відокремлено від домену застосунку. README, START, architecture, публічну API-сторінку та work plan синхронізовано.
- **Перевірки:** Повний Jest (38 suites / 104 tests) і `npx tsc --noEmit` виконано успішно. ESLint виявив 7 наявних помилок поза зміненими файлами; нова API-документація помилок не додає. Повторний production build після правок зупинено зовнішнім блокуванням OneDrive у `.next` (`EPERM` під час видалення старого build-артефакту), без діагностованої помилки вихідного коду. Docker/Prisma live-перевірку відкладено: на момент аудиту Docker Desktop не було запущено.
- **Нові змінні оточення:** Немає; додано лише задокументований безпечний шаблон `.env.example`.

## 2026-08-25

- **Задача:** Актуалізація API-аудиту та системного health-check.
- **Опис:** Штатний аудит синхронізовано з фактичним контрактом health API й доповнено безпечними read-only перевірками NextAuth-сесії, account- і admin-меж з карти API. Health-check окремо показує доступність PostgreSQL, S3 і Gotenberg, вимикає кешування та за деградації повертає `503` без внутрішніх помилок.
- **Перевірки:** `docker compose up -d`, `npm run audit:api`, повний Jest (37 suites / 103 tests), `npx tsc --noEmit`, ESLint і production build.
- **Нові змінні оточення:** Немає.

## 2026-08-25

- **Задача:** Повторна звірка статусів `work_plan.md`.
- **Опис:** Усі розділи плану повторно зіставлено з кодом і злитими етапами. Застарілий Frontend‑13 переведено у «виконано»; у вже завершених audit-задач прибрано позначки пріоритету, призначені лише для незакритої роботи.

## 2026-08-25

- **Задача:** Підготовчий аудит MVP і актуалізація плану.
- **Опис:** Звірено код, міграції, маршрути, тести та документацію. Пріоритети перебудовано: спочатку локальний запуск/документація (`+, 1`), потім реальні integration/E2E (`+, 2`). Задачі з `-` залишаються відкладеними: вони потребують провайдера, спеціалізованого рушія, зростання навантаження або production-рішення.
- **Перевірки:** Повний Jest: 36 suites / 101 tests; production build компілюється.

## 2026-08-25

- **Задача:** Гостьова конвертація без реєстрації.
- **Опис:** Додано потоковий публічний conversion endpoint без S3 та історії, місячні квоти гостя й активні guest upload-зони на головній сторінці.
- **Доповнення:** Гостьовий потік завершено: додано короткий IP limiter, залишок квоти, окреме вимкнення вичерпаного напряму та 10-хвилинне повторне download у поточній вкладці.
- **Перевірки:** `npx prisma generate`, `npx tsc --noEmit`.
- **Нові змінні оточення:** Немає.

## 2026-08-25

- **Задача:** Адмін-панель і моніторинг на реальних даних.
- **Опис:**
  - Mock users і непідтримувані edit/delete дії замінено захищеним пошуком, керуванням статусом та відкликанням ключів.
  - Додано admin-only метрики й read-only health-check PostgreSQL, MinIO та Gotenberg; публічний health більше не повертає лічильник користувачів.
- **Перевірки:**
  - TypeScript і цільові Jest-тести виконано перед підсумковим комітом.
- **Змінені файли:**
  - Admin API/агрегати, `SystemMonitoring`, `UserManagement`, health-check і документація.
- **Нові змінні оточення:**
  - Немає.

## 2026-08-25

- **Задача:** Відновлення пароля та підтвердження без оплати.
- **Опис:**
  - Реалізовано одноразові SHA-256-токени з TTL 30 хвилин для скидання пароля та підтвердження email; вихідні токени у БД не зберігаються.
  - Запит скидання відповідає нейтрально, не розкриває наявність email і локально обмежений трьома спробами на годину; успішна зміна пароля видаляє токен і зберігає bcrypt-хеш.
  - У Dashboard додано фактичне надсилання email-підтвердження, Telegram залишається окремою захищеною webhook-прив'язкою. Для локальної доставки додано MailHog, для production — SMTP-конфігурацію.
- **Перевірки:**
  - `npx prisma generate`, TypeScript, цільові Jest-тести, production-збірку та локальну UI-перевірку виконано перед фінальним комітом.
- **Змінені файли:**
  - Prisma-схема та міграція, `lib/auth/recovery.ts`, SMTP-mailer, auth/account API, форми reset/email verification, `docker-compose.yml` і документація.
- **Нові змінні оточення:**
  - `NEXTAUTH_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_SECURE`; для production за потреби `SMTP_USER`, `SMTP_PASSWORD`.

## 2026-08-25

- **Задача:** Dashboard на реальних даних.
- **Опис:**
  - Dashboard підключено до account API: реальних тарифів/usage, налаштування зберігання, Telegram, історії та API-ключів.
  - Додано session-захищений профільний контракт для читання профілю та зміни відображуваного імені; фіктивні операції профілю та випадкову генерацію ключів видалено.
- **Змінені файли:**
  - Dashboard components, `app/api/account/profile/route.ts`, billing API і документація.
- **Нові змінні оточення:**
  - Немає.

## 2026-08-25

- **Задача:** Синхронізація технічної документації з реалізованим MVP.
- **Опис:**
  - `README.md`, `architecture.md` і `START.md` оновлено: аутентифікацію, API-ключі, ролі, Telegram, тарифні квоти, browser-конвертацію, приватне S3-зберігання та доступні напрями конвертації описано як реалізовані.
  - Актуалізовано схему БД, E2E-план і публічну сторінку `/docs`; додано session-захищені browser-маршрути та фактичні обмеження API.
  - Розділ «Структура папок проєкту» у `architecture.md` повторно звірено з репозиторієм: у ньому відображено account/admin API, billing, файли/приватність/S3, Telegram, scripts, migrations і розташування тестів.
- **Змінені файли:**
  - `README.md`, `docs/architecture.md`, `docs/START.md`, `docs/db-schema.md`, `docs/e2e_test_plan.md`, `docs/progress.md`, `app/docs/page.tsx`.
- **Нові змінні оточення:**
  - Немає.

## 2026-08-25

- **Задача:** Реальна конвертація з браузера для авторизованого користувача.
- **Опис:**
  - Додано session-захищений `POST /api/account/conversions`: він звіряє актуальний статус користувача у PostgreSQL, застосовує тарифну квоту, Core та налаштування приватності без API-ключа у браузері.
  - Головна сторінка більше не обіцяє анонімну конвертацію: неавторизованому користувачу доступні вхід і реєстрація, а авторизованому — `JPG ↔ PNG` і `DOCX → PDF`.
  - При вимкненому зберіганні результат завантажується потоком; при зберіганні головна сторінка очікує захищений session-download готового результату, а файл також залишається в історії. Browser-завантаження DOCX обмежене фактично підтримуваним напрямом.
- **Перевірки:**
  - `npx tsc --noEmit`, повний Jest-набір і production-збірка — успішно. Повний ESLint запускається, але залишається заблокованим сімома наявними помилками поза цим етапом; нова browser-конвертація додає лише коректні попередження спільного Tailwind-плагіна.
  - Локальна Playwright-перевірка `http://127.0.0.1:3000`: коректний неавторизований екран, без console warnings/errors; кнопка `Log In` веде на `/login`.
- **Змінені файли:**
  - Session conversion API, спільна server-side логіка конвертації, головна сторінка, `FileDropzone`, upload policy, route-тести та документація.
- **Нові змінні оточення:**
  - Немає.

## 2026-08-25

- **Задача:** Пріоритизація наступних задач локального MVP.
- **Опис:**
  - До двох списків незавершених робіт додано єдині позначки виконуваності (`+`/`-`) та загального пріоритету.
  - Із пріоритетного огляду вилучено вже виконаний етап тарифів, квот і Mock Checkout; наступним виконуваним етапом визначено browser-конвертацію для авторизованого користувача (`+, 1`).
- **Змінені файли:**
  - `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-25

- **Задача:** Frontend‑12 / Backend — тарифи, квоти та Mock Checkout.
- **Опис:**
  - Додано тарифи Convertly з лімітами успішних конвертацій, розміру файлу, тимчасового S3-зберігання, API та підтримки; Free-акаунт створюється під час реєстрації та зберігає результати 24 години.
  - Додано `Subscription` і `PENDING_DEMO`: Mock Checkout перевіряє лише демонстраційні поля, замінює єдину очікувану зміну та не приймає/не зберігає платіжні реквізити й не надає платних прав.
  - Додано session-захищені billing/preferences/history API, UI тарифів і Dashboard usage/retention. API-ключі та API-конвертація перевіряють активний тариф на сервері.
  - Міграцію `20260825090000_subscription_quotas` створено, але не застосовували.
- **Перевірки:**
  - `npx prisma generate`, `npx tsc --noEmit` і 12 цільових Jest-тестів — успішно.
- **Змінені файли:**
  - Prisma-схема та міграція, `lib/billing/*`, account/API-маршрути, Pricing/Dashboard, тести й документація.
- **Нові змінні оточення:**
  - Немає.

## 2026-08-25

- **Задача:** Зафіксувати етап тарифів, квот і Mock Checkout.
- **Опис:**
  - До пріоритетного огляду додано самостійну задачу до вибору платіжного провайдера: релевантні тарифи Convertly, server-side квоти, зареєстрований Free-акаунт із тимчасовим зберіганням, відображення `expiresAt` і Mock Checkout.
  - Зафіксовано модель однієї замінюваної очікуваної зміни тарифу (`PENDING_DEMO`), яка не надає платних прав і не збирає справжніх платіжних даних.
- **Змінені файли:**
  - `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Аудит готовності локального MVP і актуалізація подальшого плану.
- **Опис:**
  - Підтверджено production-збірку після очищення лише згенерованого кешу `.next`.
  - Платіжні роботи винесено в окремий заморожений пункт до вибору провайдера; server-side reset і підтвердження виділено в самостійну задачу без залежності від оплати.
  - До `work_plan.md` додано задачі локального MVP: актуальна документація та `.env.example`, реальна browser-конвертація, Dashboard і Admin на реальних API/метриках, а також password reset.
  - Production deployment розширено порівнянням Vercel, Render і Oracle Cloud Free Tier та обов'язковими експлуатаційними кроками.
- **Змінені файли:**
  - `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Аудит актуальності `docs/work_plan.md`.
- **Опис:**
  - Додано пріоритетний огляд усіх незавершених пунктів до розділу Frontend: причини, шлях виконання та рекомендований етап для server-side reset/payment, `PDF → DOCX`, Redis limiter, оптимізації пошуку admin, реальних backend integration/E2E і production deployment.
  - Уточнено критерії статусу «виконано» для Frontend і Backend. У розділі тестування окремо зазначено, що backend unit/route-тести реалізовано, а справжні HTTP integration/E2E з PostgreSQL, MinIO та Gotenberg залишаються окремою задачею.
- **Змінені файли:**
  - `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend - 9. Логіка для Адмін-панелі.
- **Опис:**
  - Додано server-side маршрути `GET /api/admin/users`, `PATCH /api/admin/users/:userId/status` і `DELETE /api/admin/api-keys/:apiKeyId`.
  - Кожен маршрут звіряє актуальні `role=ADMIN` і `status=ACTIVE` у PostgreSQL. Пошук використовує обмежений `select`, cursor-pagination і параметри `query`/`limit`; статус неможливо змінити для власного облікового запису.
  - Блокування користувача миттєво вимикає його API-ключі через вже наявну перевірку `User.status`; адміністративне відкликання ключа виконується атомарно та зберігає історію конвертацій.
- **Змінені файли:**
  - `app/api/admin/*`, `lib/admin/user-management.ts`, пов'язані тести
  - `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/START.md`, `docs/progress.md`, `docs/audits/*`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend - 8. Безпека та валідація.
- **Опис:**
  - Додано in-memory rate limiter на 30 запитів за хвилину для кожного чинного API-ключа. Перевищення повертає `429 Too Many Requests` і `Retry-After`; до горизонтального масштабування потрібен спільний Redis-сумісний backend.
  - Перевірки розміру, MIME та цільового формату винесено до читання файлу в `Buffer`; API повертає безпечні `413`, `415` і `422`, а Core додатково перевіряє сигнатури та не розкриває помилок воркерів.
  - Додано unit- і route-тести ліміту, `429` та раннього відхилення oversized файлу.
- **Змінені файли:**
  - `app/api/v1/convert/route.ts`, `lib/api/rate-limit.ts`, `lib/api/conversion-request.ts`, пов'язані тести
  - `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/START.md`, `docs/progress.md`, `docs/audits/*`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend - 7. Генерація API-ключів.
- **Опис:**
  - Додано NextAuth-захищені маршрути списку, створення та відкликання власних API-ключів: `GET`/`POST /api/account/api-keys` і `DELETE /api/account/api-keys/:apiKeyId`.
  - Секрет формується `crypto.randomBytes`, повертається лише у відповіді створення з `Cache-Control: no-store`; PostgreSQL зберігає виключно SHA-256-хеш і безпечний префікс.
  - Відкликання використовує owner-scoped `updateMany` для атомарного захисту від відкликання чужого або вже відкликаного ключа; історія конвертацій зберігається.
- **Змінені файли:**
  - `app/api/account/api-keys/*`, `lib/api/api-keys.ts`, `docs/architecture.md`, `docs/db-schema.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/START.md`, `docs/progress.md`, `docs/audits/*`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend - 6. Керування приватністю результатів.
- **Опис:**
  - Додано серверне розгалуження за `User.storeConversions`: при увімкненому зберіганні Core зберігає результат у приватний user-scoped S3-ключ; при вимкненому результат видається з `POST /api/v1/convert` бінарним потоком і не записується до S3.
  - Додано `GET /api/v1/conversions/:conversionId/download`: він перевіряє Bearer API-ключ, належність `ConversionLog` користувачу та потоково видає лише збережений результат. Публічні S3 URL не використовуються.
  - Додано unit- і route-тести режимів приватності, user-scoped ключів, відсутності доступу до чужого результату та stream-відповідей.
- **Змінені файли:**
  - `app/api/v1/convert/route.ts`, `app/api/v1/conversions/[conversionId]/download/route.ts`, `lib/api/conversion-request.ts`, `lib/core/conversion-job.ts`, `lib/privacy/conversion-results.ts`
  - `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/START.md`, `docs/progress.md`, `docs/audits/*`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend - 5. Ядро конвертації (Core).
- **Опис:**
  - Реалізовано Core-модуль: `sharp` конвертує `JPG ↔ PNG`, а `DOCX → PDF` делегується Gotenberg із таймаутом 30 секунд.
  - `POST /api/v1/convert` запускає оброблення після відповіді `202`; журнал конвертацій проходить стани `PENDING → PROCESSING → COMPLETED/FAILED` і зберігає лише метадані результату.
  - Додано перевірку сигнатур JPG, PNG і DOCX до оброблення, перевірку PDF-відповіді воркера та безпечне узагальнене повідомлення у разі збою. `PDF → DOCX` залишається planned.
- **Змінені файли:**
  - `app/api/v1/convert/route.ts`, `lib/core/conversion.ts`, `lib/core/conversion-job.ts`
  - `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/START.md`, `docs/progress.md`, `docs/audits/*`
- **Нові файли:**
  - `lib/core/__tests__/conversion.test.ts`, `lib/core/__tests__/conversion-job.test.ts`
- **Нові змінні оточення:**
  - Необов'язкова `GOTENBERG_URL` (за замовчуванням локальна адреса воркера).

## 2026-08-24

- **Задача:** Узгодження політики форматів, розміру файлів і стартової документації перед Backend - 5.
- **Опис:**
  - Зафіксовано єдину політику завантаження: `JPG`, `PNG`, `DOCX`, `PDF`, не більше 10 МБ; frontend фільтрує вибір файлу, API повторює перевірки, а Core має перевіряти сигнатуру файлу.
  - Для Core підтверджено `JPG ↔ PNG` і `DOCX → PDF`. `PDF → DOCX` виділено як окремий best-effort-напрям, який потребуватиме спеціалізованого рушія та контролю якості.
  - Актуальну інструкцію запуску перенесено до `docs/START.md`; історичну чернетку — до `docs/archive/START_.md`.
- **Змінені файли:**
  - `components/core/FileDropzone.tsx`, `app/page.tsx`, `lib/files/upload-policy.ts`, `lib/api/conversion-request.ts`
  - `docs/tech_saas.md`, `docs/work_plan.md`, `docs/architecture.md`, `docs/START.md`, `docs/progress.md`, `AGENTS.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-24

- **Задача:** Backend - 4. API для конвертації (`POST /api/v1/convert`).
- **Опис:**
  - Додано захищений Bearer API-маршрут, який приймає `multipart/form-data`, перевіряє SHA-256-хеш активного невідкликаного API-ключа та створює в транзакції запис `ConversionLog` зі статусом `PENDING`.
  - Додано перевірки підтримуваних MIME-типів, цільових форматів і ліміту файлу 10 МБ; маршрут повертає `202 Accepted` без передчасної обіцянки готового результату.
  - Додано unit- і route-тести для авторизації ключа, валідації та HTTP-контракту. Реальне оброблення і збереження файлів залишаються наступною задачею Core.
  - До `docs/architecture.md` додано розділ із переліком реалізованих API endpoints: методи, тип авторизації, призначення та основні HTTP-статуси.
- **Змінені файли:**
  - `app/api/v1/convert/route.ts`, `lib/api/conversion-request.ts`, `app/docs/page.tsx`
  - `docs/architecture.md`, `docs/work_plan.md`, `docs/progress.md`, `docs/audits/*`
- **Нові файли:**
  - `app/api/v1/convert/__tests__/route.test.ts`, `lib/api/__tests__/conversion-request.test.ts`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Задокументувати експлуатацію RBAC і Telegram.
- **Опис:** До `START.md` додано покрокові інструкції: застосування міграції `20260824093000_rbac_telegram`, заповнення Telegram-змінних, налаштування webhook і одноразове призначення першого адміністратора командою `npm run admin:seed-first`.
- **Змінені файли:**
  - `START.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend‑3 — RBAC і прив'язка Telegram.
- **Опис:** Dashboard доступний усім авторизованим користувачам, а `/management` додатково потребує `ADMIN` на сервері; клієнтське меню приховує недоступні посилання. Підготовлено audit-модель і захищений процес призначення першого адміністратора. Додано одноразові Telegram deep links із SHA-256-хешем, 15-хвилинним строком дії та webhook-перевіркою секретного заголовка. Міграцію `20260824093000_rbac_telegram` підготовлено, але не застосовували до БД.
- **Змінені файли:**
  - `app/api/account/telegram/link/route.ts`, `app/api/telegram/webhook/route.ts`, `app/(dashboard)/management/layout.tsx`
  - `lib/auth/admin.ts`, `lib/auth/authorization.ts`, `lib/telegram/linking.ts`, `scripts/seed-first-admin.mjs`
  - `prisma/schema.prisma`, `prisma/migrations/20260824093000_rbac_telegram/migration.sql`, `.env`
  - `components/core/Header.tsx`, `components/dashboard/TelegramLinkButton.tsx`, `components/dashboard/UserProfile.tsx`, тести та документація
- **Нові змінні оточення:**
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `SEED_ADMIN_EMAIL`.

## 2026-08-24

- **Задача:** Уточнити наступний Backend‑етап у плані робіт.
- **Опис:** Після завершеної логіки реєстрації та входу до Backend‑плану додано задачу щодо server-side RBAC і безпечної прив'язки Telegram: права `USER`/`ADMIN`, призначення першого адміністратора, аудит змін ролі, одноразові токени та webhook-верифікація Telegram.
- **Змінені файли:**
  - `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend‑2 — реєстрація та вхід за паролем.
- **Опис:** Додано `POST /api/auth/register`, bcrypt-хешування та Credentials Provider NextAuth.js. Реєстрація нормалізує email, перевіряє вхідні дані, не повертає пароль і обробляє конфлікт унікальності. Вхід перевіряє bcrypt-хеш та активний статус користувача, оновлює `lastLoginAt`, після чого формує вже захищену JWT-сесію. Роль додається до сесії для майбутньої серверної авторизації, проте Dashboard залишається доступним і адміністраторам. Демо-форми замінено реальними запитами й тестами. Перевірки: 13 Jest suites / 31 tests, `npx tsc --noEmit` і 3 цільові Playwright-сценарії — успішно.
- **Змінені файли:**
  - `app/api/auth/register/route.ts`, `app/api/health/route.ts`, `lib/prisma.ts`
  - `lib/auth/options.ts`, `lib/auth/users.ts`, `types/next-auth.d.ts`
  - `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`, пов'язані тести та `jest.setup.ts`
  - `docs/architecture.md`, `docs/work_plan.md`, `docs/progress.md`, security-аудит
- **Нові змінні оточення:**
  - Немає.

## 2026-08-24

- **Задача:** Backend‑1 — аутентифікація користувачів і сесії NextAuth.js.
- **Опис:** Додано обробники NextAuth.js і JWT-сесії у HttpOnly cookie з `SameSite=Lax`, 8-годинним TTL і прапорцем `Secure` у production. Маршрути особистого кабінету та адміністрування перевіряють сесію на сервері й перенаправляють неавторизованих користувачів на `/login`. Демо-вхід видалено: реальна перевірка пароля залишається наступною backend-задачею. Перевірки: `npx jest --runInBand` (11 suites, 24 tests), `npx tsc --noEmit` і 3 цільові Playwright-сценарії — успішно.
- **Змінені файли:**
  - `app/api/auth/[...nextauth]/route.ts`, `app/(dashboard)/layout.tsx`, `app/layout.tsx`
  - `components/auth/AuthSessionProvider.tsx`, `components/auth/LoginForm.tsx`, `components/core/Header.tsx`
  - `lib/auth/*`, `e2e/critical-flows.spec.ts`, `components/auth/__tests__/LoginForm.behavior.test.tsx`
  - `docs/architecture.md`, `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає; використовується наявна приватна `NEXTAUTH_SECRET`.

## 2026-08-24

- **Задача:** Аудит секретів і перенесення конфігурації Docker до кореневого `.env`.
- **Опис:** Облікові дані PostgreSQL і MinIO видалено з `docker-compose.yml`; Compose отримує їх зі змінних оточення. `.env` доповнено змінними локальної інфраструктури та сесій, що відповідають Convertly Hub. Виконано аудит вихідного коду, Prisma та API-маршруту.
- **Змінені файли:**
  - `.env`, `docker-compose.yml`
  - `docs/audits/security-audit-latest.md`, `docs/audits/security-audit-2026-08-24T08-35-01-368Z.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - `NODE_ENV`, `NEXTAUTH_URL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MINIO_BUCKET`.

## 2026-08-22

- **Задача:** Інтегрувати сервісний шар S3-сумісного сховища з MinIO.
- **Опис:**
  - Додано `lib/storage/s3.ts`: лінивий серверний клієнт AWS SDK v3 у MinIO path-style режимі, перевірка доступності бакета та операції `uploadFile`, `downloadFile`, `deleteFile`.
  - Секрети залишаються у приватних змінних оточення; сервіс не формує публічні URL і відхиляє порожні або абсолютні ключі об'єктів.
  - Перевірки: 5 unit-тестів з ізольованим AWS SDK-моком, `npx tsc --noEmit`, а також реальні MinIO upload/download/delete з тимчасовим об'єктом — успішно.
- **Змінені файли:**
  - `lib/storage/s3.ts`, `lib/storage/__tests__/s3.test.ts`
  - `docs/work_plan.md`, `docs/architecture.md`, `docs/tech_saas.md`, `START.md`, `README.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Необов'язкова `MINIO_BUCKET` (за замовчуванням `convertly-files`).

## 2026-08-22

- **Задача:** Створити та застосувати міграцію фінальної схеми даних.
- **Опис:**
  - Створено міграцію `20260822120000_finalize_schema`: переліки, модель `ApiKey`, метадані конвертацій, індекси, хешовані auth-токени та каскадні зв'язки приведено до поточної Prisma-схеми.
  - Перед застосуванням перевірено, що локальні таблиці `User` і `ConversionLog` порожні. Міграцію застосовано через `npx prisma migrate deploy`.
  - Перевірки: `npx prisma migrate status`, `npx prisma validate` і `npx prisma generate` — успішно. Для нових оточень документація використовує `npx prisma migrate deploy`; `db push` більше не пропонується як спосіб синхронізації схеми.
- **Змінені файли:**
  - `prisma/migrations/20260822120000_finalize_schema/migration.sql`
  - `docs/work_plan.md`, `docs/db-schema.md`, `docs/architecture.md`, `START.md`, `README.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Фіналізувати Prisma-схему для користувачів, API-ключів та історії конвертацій.
- **Опис:**
  - Додано переліки ролей, статусів, тарифів і станів конвертацій; розширено `User` і `ConversionLog`, додано модель `ApiKey`.
  - Налаштовано зв'язки та індекси для історії користувача, оброблення черги й аудиту викликів API; бінарні файли залишаються поза PostgreSQL і пов'язуються через `storageKey` у S3.
  - API-ключі й одноразові auth-токени спроєктовано для зберігання лише у вигляді хешів; тимчасові поля використовують `timestamptz(3)`.
  - Перевірки: `npx prisma format`, `npx prisma validate` і `npx prisma generate` — успішно. Подальшу перевірку `npm run build` також завершено успішно; тимчасова помилка `EPERM` у `.next` не відтворилася. Міграцію створено та застосовано окремою задачею.
- **Змінені файли:**
  - `prisma/schema.prisma`, `docs/db-schema.md`, `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Виконати налаштування та запуск локальної інфраструктури PostgreSQL, MinIO і Gotenberg.
- **Опис:**
  - Перевірено Docker Desktop і Compose; запущено сервіси `db`, `minio` та `gotenberg` з `docker-compose.yml`.
  - Перевірки: PostgreSQL — `pg_isready` приймає підключення; MinIO — успішний liveness check; Gotenberg — Chromium і LibreOffice у статусі `up`; `npx prisma migrate status` підтвердив актуальність схеми.
  - Оновлено інструкцію запуску, архітектурний статус і план робіт. Користувацькі потоки конвертації, S3-зберігання та аутентифікації не змінювалися.
- **Змінені файли:**
  - `docs/work_plan.md`, `docs/architecture.md`, `START.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Додати україномовні skills і правила для PostgreSQL та Prisma.
- **Опис:**
  - Створено `database-migrations`, `postgres-patterns` і `prisma-patterns` для безпечних міграцій, PostgreSQL-продуктивності та Prisma 7.
  - Додано правило `.codex/rules/local-database.md` з маршрутизацією задач бази даних і обмеженнями на команди, що змінюють дані.
  - `database-reviewer`, `AGENTS.md` й архітектурну документацію пов'язано з новими навичками.
- **Змінені файли:**
  - `.codex/skills/database-migrations/SKILL.md`, `.codex/skills/postgres-patterns/SKILL.md`, `.codex/skills/prisma-patterns/SKILL.md`
  - `.codex/skills/database-reviewer/SKILL.md`, `.codex/rules/local-database.md`
  - `AGENTS.md`, `docs/architecture.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Додати україномовний skill `database-reviewer` для PostgreSQL і Prisma.
- **Опис:**
  - Створено локальну навичку для рев'ю схеми, міграцій, запитів, індексів, транзакцій і продуктивності PostgreSQL.
  - Навичка враховує Prisma 7 і обмежує небезпечні команди БД вимогою явного дозволу.
  - `AGENTS.md` і `docs/architecture.md` доповнено посиланнями на навичку.
- **Змінені файли:**
  - `.codex/skills/database-reviewer/SKILL.md`
  - `AGENTS.md`, `docs/architecture.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Видалити конфігурації невикористовуваних coding agents.
- **Опис:**
  - Видалено `.claude/`, `.gemini/`, `.windsurf/`, а також кореневі файли `CLAUDE.md` і `GEMINI.md`.
  - Збережено актуальні інструкції Codex (`.codex/`, `AGENTS.md`) та встановлені Prisma skills (`.agents/`, `skills-lock.json`).
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Уточнити розташування component-тестів в архітектурній документації.
- **Опис:**
  - В `architecture.md` явно перелічено підпапки `components/*/__tests__` та їх призначення.
  - Уточнено, що unit-, component- і UI-integration-тести розташовуються поруч із компонентами, що тестуються.
- **Змінені файли:**
  - `docs/architecture.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Аудит фактичного стану проєкту й актуалізація документації.
- **Опис:**
  - Звірено `work_plan.md`, вихідний код, маршрути, Prisma-схему, конфігурації та тести.
  - Уточнено розмежування між готовим frontend-прототипом і запланованим backend: UI використовує mock-дані, а NextAuth, конвертацію, S3, API-ключі, платежі та серверне адміністрування ще не реалізовано.
  - Виправлено неактуальні auth-маршрути та інструкцію запуску за зайнятого порту Gotenberg.
  - Перевірки: `npm run build` — успішно; `npm run test:e2e` — 5 сценаріїв passed. `npm test -- --runInBand` не запустився через несумісне передавання CLI-прапорця поточним npm; прямий `npx jest --runInBand` завершився з кодом 0 без діагностичного виводу. Результат `npm run linteslint` у цьому середовищі не було виведено виконавцем.
- **Змінені файли:**
  - `README.md`, `START.md`
  - `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Впровадити E2E-тестування критичних frontend-сценаріїв.
- **Опис:**
  - Підключено Playwright із Chromium і командами `npm run test:e2e` / `npm run test:e2e:ui`.
  - Автоматизовано головну сторінку, вхід, вибір тарифу й імітацію оплати, роботу з історією конвертацій і керування користувачами.
  - Виправлено hydration-помилку Dashboard: форматування чисел тепер використовує однакову локаль при SSR і в браузері.
  - Створено `docs/e2e_test_plan.md` з переліком backend-залежних сценаріїв, які слід додати після реалізації серверних контрактів.
  - Перевірки: `npm run test:e2e` — 5 сценаріїв passed; `npm test` — 9 suites / 18 tests passed; `npm run linteslint` і `npm run build` — успішно.
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Розширити тестове покриття наявного frontend-функціоналу.
- **Опис:**
  - Додано unit-, component- та integration-тести для завантаження файлів, реєстрації, модальних вікон, оплати, пошуку, пагінації, API-ключів, приватності й керування користувачами.
  - Додано команду `npm run test:coverage` і dev-залежність `msw` для ізольованого мокування майбутніх мережевих integration-тестів.
  - Оновлено `docs/architecture.md` і `docs/work_plan.md`: описано тестову архітектуру, а задачу тестування позначено як частково виконану — backend-покриття залишається у плані.
  - Перевірки: `npm test` — 9 suites / 18 tests passed; `npm run test:coverage` — 88.52% statements; `npm run linteslint` і `npm run build` — успішно.
- **Змінені файли:**
  - `package.json`, `package-lock.json`
  - `components/**/__tests__/*`
  - `docs/tech_saas.md`, `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-22

- **Задача:** Аудит міграції з Gemini Code Assist на Codex та актуалізація інструкцій проєкту.
- **Опис:**
  - Перевірено перенесення правил: файли з `.gemini/rules` збережено у `.codex/rules` без розбіжностей. `DESIGN.md` залишено лише у корені як єдиний канонічний файл дизайн-системи.
  - `AGENTS.md` актуалізовано для Codex: відображено лише активні MCP (`context7`, `chrome-devtools`, `playwright`, `github`), додано Project Discovery, перевірку змін і шлях до Prisma-навичок, усунено посилання на відсутні GitLab/Atlassian MCP та Gemini-специфічні назви інструментів.
  - Збережено й уточнено розділи «Архітектурні задачі», «Життєвий цикл задач і Git Workflow» та «Тестування»: нова гілка обов'язкова за замовчуванням, крім прямої вказівки користувача працювати без неї або у поточній гілці.
  - Перевірки: `codex mcp list` — 4 сервери увімкнено; `npm test` — 2 suites / 6 tests passed; `npm run build` — успішно. `npm run linteslint` не проходить: 11 наявних помилок і 590 попереджень (переважно налаштування Tailwind), без змін прикладного коду в межах цієї задачі.
- **Змінені файли:**
  - `AGENTS.md`
  - `.gitignore`
  - `.codex/rules/local-verification.md`
  - `docs/progress.md`
- **Нові змінні оточення:**
  - Немає

## 2026-08-18

- **Задача:** Поліпшення UI/UX і виправлення багів.
- **Опис:**
  - Проведено рефакторинг шапки сайту: меню навігації переміщено у праву частину для поліпшення користувацького досвіду.
  - Змінено маршрут адмін-панелі з `/admin` на `/management` для підвищення безпеки.
  - Виправлено баг у меню користувача на сторінці адміністрування, через який спливне вікно не закривалося при повторному натисканні.
  - Додано стиль `cursor: pointer` для всіх кнопок на сайті через оновлення базового компонента `Button`.
  - Виправлено проблему з перенесенням тексту на кнопці "Confirm Telegram".
- **Змінені файли:**
  - `convertly-hub/app/(dashboard)/admin/page.tsx` (перейменовано на `management/page.tsx`)
  - `convertly-hub/components/core/Header.tsx` (оновлено структуру та посилання на адмін-панель)
  - `convertly-hub/components/admin/UserManagement.tsx` (виправлено баг із меню)
  - `convertly-hub/components/ui/Button.tsx` (додано `cursor: pointer`)
  - `convertly-hub/components/dashboard/UserProfile.tsx` (виправлено перенесення тексту)
- **Нові змінні оточення:**
  - Немає

## 2026-08-16

- **Задача:** Завершення та злиття гілки `feature/auth-payment-flow`.
- **Опис:**
  - Реалізовано повний цикл аутентифікації та керування акаунтом:
    - **Відновлення пароля:** Додано сторінки для запиту скидання та встановлення нового пароля. Реалізовано логіку надсилання токенів на пошту.
    - **Верифікація:** Додано механізм підтвердження пошти й акаунта Telegram.
    - **Оплата:** На сторінці тарифів додано модальне вікно для початку процесу оплати.
    - **UX:** На сторінці "Forgot Password" посилання "Назад" тепер веде на попередню сторінку.
  - Усі зміни з гілки `feature/auth-payment-flow` було злито до `main`.
  - Оновлено документацію (`architecture.md`, `db-schema.md`, `work_plan.md`) для відображення нових функцій.
- **Нові файли:**
  - `convertly-hub/app/(auth)/password-reset/page.tsx`
  - `convertly-hub/app/(auth)/password-reset/[token]/page.tsx`
  - `convertly-hub/components/pricing/PaymentModal.tsx`
  - `convertly-hub/components/ui/Card.tsx`
  - `convertly-hub/components/ui/Input.tsx`
  - `convertly-hub/components/ui/Label.tsx`
  - `convertly-hub/prisma/migrations/20260816094436_auth_features/...`
- **Змінені файли:**
  - `convertly-hub/prisma/schema.prisma` (розширено модель `User`)
  - `convertly-hub/docs/work_plan.md` (додано п.11)
  - `convertly-hub/docs/db-schema.md` (оновлено схему `User`)
  - `convertly-hub/docs/architecture.md` (оновлено структуру папок і додано потоки аутентифікації)
  - `convertly-hub/components/dashboard/UserProfile.tsx` (додано посилання на скидання пароля та поле Telegram)
  - `convertly-hub/app/pricing/page.tsx` (інтегровано модальне вікно оплати)
- **Нові змінні оточення:**
  - Немає

## 2026-08-15 (v3)

- **Задача:** Frontend - 10. UI-компоненти: створити повторно використовувані компоненти для сповіщень (Toasts), модальних вікон та інших елементів зворотного зв'язку.
- **Опис:**
  - Створено нову директорію `components/ui` для зберігання базових UI-компонентів.
  - Створено та інтегровано повторно використовувані компоненти: `Button`, `Modal`, `Pagination`, `Search`.
  - Додано бібліотеку `sonner` для toast-сповіщень і створено компонент `Toast`.
  - Впроваджено toast-сповіщення для різних дій користувача: завантаження файлів, CRUD-операції з користувачами, керування API-ключами тощо.
  - Виправлено помилку з пропом `asChild` у компоненті `Button` за допомогою `@radix-ui/react-slot`.
  - Виправлено помилки в роботі пагінації, пов'язані з некоректним використанням `useCallback`.
- **Нові файли:**
  - `convertly-hub/components/ui/Button.tsx`
  - `convertly-hub/components/ui/Modal.tsx`
  - `convertly-hub/components/ui/Pagination.tsx`
  - `convertly-hub/components/ui/Search.tsx`
  - `convertly-hub/components/ui/Toast.tsx`
  - `convertly-hub/lib/hooks/use-toast.ts`
- **Видалені файли:**
  - `convertly-hub/components/core/Pagination.tsx`
- **Змінені файли:**
  - `convertly-hub/docs/architecture.md` (актуалізовано структуру та додано UI-бібліотеки)
  - `convertly-hub/package.json` (додано `sonner`, `cva`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`)
  - Багато компонентів було рефакторено для використання нових UI-компонентів.
- **Нові змінні оточення:**
  - Немає

## 2026-08-15 (v2)

- **Задача:** Рефакторинг та уніфікація стилів, поліпшення користувацького досвіду й розширення функціональності Admin Panel і Dashboard.
- **Опис:**
  - Завершено всі основні сторінки: Головна, Dashboard, Admin, Pricing, Docs, Log In, Sign Up.
  - Проведено уніфікацію стилів (кнопки, кольори) в усьому застосунку для забезпечення мінімалістичного дизайну.
  - Кнопку "Log Out" переміщено до заголовка для кращої доступності.
  - Скориговано колір виділення "POST" на сторінці Docs.
  - Прибрано кольорове виділення маркерів списку у блоці "Included Features" на сторінці Dashboard.
  - Іконки завантаження SVG на Головній сторінці тепер сині.
  - Модальні вікна тепер закриваються натисканням Esc і кліком поза вікном.
  - **Admin Panel - User Management:**
    - Додано функціональність редагування та видалення користувачів через спливне меню (три крапки).
    - Реалізовано підтвердження видалення користувача.
    - Модальне вікно редагування користувача містить поля: Name, Email, New Password, Role.
    - Додано сортування користувачів за полями: Name, Role, Status, Last Login.
    - Поліпшено зручність модальних вікон (вужчі, закриття через Esc/клік поза вікном).
  - **Dashboard - Conversion History:**
    - Додано пошук за файлами, сортування за полями та пагінацію.
  - Усі зміни об'єднано з гілки `refactor/unify-styles` до `main`.
- **Змінені файли:**
  - `convertly-hub/docs/architecture.md` (актуалізація структури проєкту)
  - `convertly-hub/components/core/Header.tsx` (переміщення кнопки Log Out)
  - Сторінки та компоненти, пов'язані зі стилями, модальними вікнами, Admin Panel і Dashboard. (Конкретні файли не перелічено, оскільки зміни торкнулися багатьох файлів стилів).
- **Нові файли:**
  - `convertly-hub/components/admin/EditUserModal.tsx`
  - `convertly-hub/components/core/ConfirmationModal.tsx`
- **Нові змінні оточення:**
  - Немає

## 2026-08-15

- **Задача:** Frontend - 9. Панель адміністратора: спроєктувати та реалізувати інтерфейс для керування користувачами й моніторингу системи.
- **Опис:**
  - Створено сторінку `/admin` з розділами для моніторингу системи та керування користувачами.
  - Розроблено компоненти `SystemMonitoring` і `UserManagement` із використанням мокових даних.
  - Додано посилання "Admin" до шапки сайту.
- **Нові файли:**
  - `convertly-hub/app/(dashboard)/admin/page.tsx`
  - `convertly-hub/components/admin/SystemMonitoring.tsx`
  - `convertly-hub/components/admin/UserManagement.tsx`
- **Змінені файли:**
  - `convertly-hub/components/core/Header.tsx`
- **Нові змінні оточення:**
  - Немає

## 2026-08-12 (v5)

- **Задача:** Frontend - 8. Документація API (/docs): створити сторінку з документацією API.
- **Опис:**
  - Створено сторінку з документацією API відповідно до п.8 `work_plan.md`.
- **Нові файли:**
  - `convertly-hub/app/docs/page.tsx` (створено)
- **Змінені файли:**
  - `convertly-hub/docs/architecture.md` (актуалізація архітектури)
  - `convertly-hub/docs/work_plan.md` (задачу 8 позначено як виконану)
- **Нові змінні оточення:**
  - Немає

## 2026-08-12 (v4)

- **Задача:** Frontend - 7. Прайс (/pricing): створити сторінку з тарифами.
- **Опис:**
  - Створено сторінку з тарифами відповідно до п.7 `work_plan.md`.
- **Нові файли:**
  - `convertly-hub/app/pricing/page.tsx` (створено)
- **Змінені файли:**
  - `convertly-hub/docs/work_plan.md` (задачу 7 позначено як виконану)
- **Нові змінні оточення:**
  - Немає

## 2026-08-12 (v3)

- **Задача:** Frontend - 6. Сторінка 404: створити дизайн для сторінки 404 у стилі всього проєкту.
- **Опис:**
  - Створено сторінку 404 відповідно до п.6 `work_plan.md`.
  - Дизайн сторінки відповідає гайдлайнам із `DESIGN.md`.
- **Нові файли:**
  - `convertly-hub/app/not-found.tsx` (створено)
- **Змінені файли:**
  - Немає
- **Нові змінні оточення:**
  - Немає

## 2026-08-12 (v2)

- **Задача:** Frontend - 5. Особистий кабінет (/dashboard): розробити компоненти для сторінки особистого кабінету відповідно до п.5 `work_plan.md`.
- **Опис:**
  - Створено компоненти `UserProfile`, `ApiKeyManager`, `PrivacySettings` і `ConversionHistory` для керування профілем, API-ключами, налаштуваннями приватності та перегляду історії конвертацій.
  - Реалізовано базову структуру сторінки `/dashboard` із використанням мокових даних.
  - Виправлено критичну помилку імпорту `useState` у `ApiKeyManager.tsx`, яка блокувала рендеринг сторінки.
- **Нові файли:**
  - `convertly-hub/app/(dashboard)/dashboard/page.tsx` (створено)
  - `convertly-hub/app/(dashboard)/layout.tsx` (створено)
  - `convertly-hub/components/dashboard/UserProfile.tsx` (створено)
  - `convertly-hub/components/dashboard/ApiKeyManager.tsx` (створено)
  - `convertly-hub/components/dashboard/PrivacySettings.tsx` (створено)
  - `convertly-hub/components/dashboard/ConversionHistory.tsx` (створено)
- **Змінені файли:**
  - `convertly-hub/docs/work_plan.md` (задачу 5 позначено як виконану)
- **Нові змінні оточення:**
  - Немає

## 2026-08-12

- **Задача:** Налаштування ESLint, Prettier і Tailwind CSS для проєкту Convertly Hub. Впровадження eslint-plugin-tailwindcss та усунення проблем із його конфігурацією.
- **Опис:**
  - Налаштовано інтеграцію `eslint-plugin-tailwindcss` для коректної роботи з Tailwind CSS v4 та ESLint 9.
  - Додано `convertly-hub/src/style.css` як тимчасове рішення (обхідний шлях) для обходу бага в `eslint-plugin-tailwindcss`, який некоректно обробляє шлях до файлів стилів. Цей файл імпортує `../app/globals.css`, щоб лінтер міг коректно читати CSS-змінні.
  - Виправлено помилку `react/no-unescaped-entities` у `app/(auth)/login/page.tsx` шляхом екранування апострофа (`'`) як `&apos;`.
  - Підтверджено, що видалення `eslintConfig` з `eslint.config.mjs` не має побічних ефектів, оскільки цю змінну не використовували поза файлом.
- **Змінені файли:**
  - `convertly-hub/package.json` (додано скрипти `linteslint` і `linteslint:fix`, додано залежності `eslint-plugin-tailwindcss`, `postcss`, `prettier`, `prettier-plugin-tailwindcss`)
  - `convertly-hub/.prettierrc` (оновлено налаштування для Tailwind CSS)
  - `convertly-hub/eslint.config.mjs` (оновлено конфігурацію ESLint для підтримки `eslint-plugin-tailwindcss`)
  - `convertly-hub/src/style.css` (створено як тимчасовий файл)
  - `convertly-hub/app/(auth)/login/page.tsx` (виправлено помилку екранування символів)
- **Нові змінні оточення:**
  - Немає

## 2026-08-10 (v7)

- **Задача:** UI/UX - Поліпшення консистентності та виправлення помилок у UI.
- **Опис:** Виконано правки у шапці та на головних сторінках для поліпшення користувацького досвіду. Усунено проблеми з висотою сторінок, видимістю кнопок і відступами.
- **Змінені файли:**
  - `convertly-hub/components/core/Header.tsx`: Скориговано стилі кнопок "Log In" і "Sign Up" для desktop і mobile версій, поліпшено їх видимість і додано hover-ефекти. Мобільне меню тепер відображає кнопки в один ряд.
  - `convertly-hub/app/page.tsx`: Головна сторінка тепер займає всю висоту екрана з центрованим вмістом, як на сторінках входу та реєстрації.
  - `convertly-hub/app/(auth)/login/page.tsx`: Перевірено консистентність верстки.
  - `convertly-hub/app/(auth)/register/page.tsx`: Перевірено консистентність верстки.
- **Нові змінні оточення:**
  - Немає

## 2026-08-10 (v6)

- **Задача:** Frontend - 4. Аутентифікація: створено сторінки та форми для реєстрації й входу відповідно до п.4 `work_plan.md`.
- **Нові файли:**
  - `convertly-hub/app/(auth)/login/page.tsx` (створено)
  - `convertly-hub/app/(auth)/register/page.tsx` (створено)
  - `convertly-hub/components/auth/LoginForm.tsx` (створено)
  - `convertly-hub/components/auth/RegisterForm.tsx` (створено)
- **Змінені файли:**
  - Немає
- **Нові змінні оточення:**
  - Немає

## 2026-08-10 (v5)

- **Задача:** Frontend - 3. Головна сторінка: реалізовано віджети Drag & Drop для конвертації файлів відповідно до п.3 `work_plan.md`.
- **Нові файли:**
  - `convertly-hub/components/core/FileDropzone.tsx` (створено)
- **Змінені файли:**
  - `convertly-hub/app/page.tsx` (інтегровано віджети Drag & Drop)
  - `convertly-hub/package.json` (додано `react-dropzone` і `lucide-react`)
- **Нові змінні оточення:**
  - Немає

## 2026-08-10 (v4)

- **Задача:** Frontend - 2. Основний макет: створено кореневий layout з навігацією та футером відповідно до п.2 `work_plan.md`.
- **Нові файли:**
  - `convertly-hub/components/core/Header.tsx` (створено)
  - `convertly-hub/components/core/Footer.tsx` (створено)
- **Змінені файли:**
  - `convertly-hub/app/layout.tsx` (додано Header і Footer)
- **Нові змінні оточення:**
  - Немає

## 2026-08-10 (v3)

- **Задача:** Налаштування ESLint і Prettier для забезпечення якості коду відповідно до п.1 розділу "Інші задачі" у `work_plan.md`.
- **Нові файли:**
  - `convertly-hub/eslint.config.mjs` (створено)
  - `convertly-hub/.prettierrc` (створено)
  - `convertly-hub/.prettierignore` (створено)
- **Змінені файли:**
  - `convertly-hub/package.json` (додано `eslint`, `prettier` і плагіни)
- **Нові змінні оточення:**
  - Немає

## 2026-08-10 (v2)

- **Задача:** Налаштування основи frontend-застосунку відповідно до п.1 `work_plan.md`. Налаштовано Tailwind CSS і базові стилі.
- **Нові файли:**
  - `convertly-hub/tailwind.config.ts` (створено)
- **Змінені файли:**
  - `convertly-hub/app/globals.css` (оновлено для відповідності `DESIGN.md`)
  - `convertly-hub/app/layout.tsx` (оновлено для використання кастомних шрифтів і стилів)
- **Нові змінні оточення:**
  - Немає

## 2026-08-10

- **Задача:** Згенеровано план виконання робіт на основі `tech_saas.md`, `architecture.md` і `db-schema.md`.
- **Нові файли:**
  - `convertly-hub/docs/work_plan.md` (створено)
- **Змінені файли:**
  - Немає
- **Нові змінні оточення:**
  - Немає

## 2026-08-10

- **Задача:** Оновлено `AGENTS.md` відповідно до запиту користувача. Виправлено інструкції "Швидкий запуск", деталізовано секцію "Робота зі стилями", об'єднано дубльовані розділи.
- **Змінені файли:**
  - `convertly-hub/AGENTS.md` (оновлено)
- **Нові змінні оточення:**
  - Немає

## 2026-08-09 (у5)

- **Задача:** Проведено аудит безпеки кодової бази. Виявлено критичні та інші вразливості.
- **Нові файли:**
- 'docs/audits/security-audit-2026-08-09.md' (створено)
- **Змінені файли:**
- 'docs/progress.md' (оновлено)
- **Нові змінні оточення:**
- Немає

## 2026-08-09 (v4)

- **Задача:** Адаптація та інтеграція нової навички `security-review`. Проаналізовано `SKILL.md`, який уже відповідає структурі проєкту. `AGENTS.md` перевірено та містить коректну інформацію про нову навичку.
- **Змінені файли:**
  - `docs/progress.md` (оновлено)
- **Нові змінні оточення:**
  - Немає

## 2026-08-09 (v3)

- **Задача:** Аналіз структури проєкту та оновлення документації. `db-schema.md` оновлено для відображення поточної схеми Prisma. `architecture.md` скориговано для відповідності реальній структурі папок.
- **Змінені файли:**
  - `docs/db-schema.md` (оновлено)
  - `docs/architecture.md` (оновлено)
- **Нові змінні оточення:**
  - Немає

## 2026-08-09 (v2)

- **Задача:** Проведено повторний аудит API.
- **Змінені файли:**
  - `docs/audits/api-audit-latest.md` (оновлено)
- **Нові змінні оточення:**
  - Немає

## 2026-08-09

- **Задача:** Оновлено скрипт аудиту API для перевірки нових ендпоінтів. Оновлено `AGENTS.md` для відображення змін в API. Проведено аудит API.
- **Змінені файли:**
  - `scripts/audit-api.mjs` (оновлено)
  - `AGENTS.md` (оновлено)
  - `docs/audits/api-audit-latest.md` (оновлено)
- **Нові змінні оточення:**
  - Немає

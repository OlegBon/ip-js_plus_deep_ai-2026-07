# Журнал изменений проекта

## 2026-08-24

- **Задача:** Уточнить следующий Backend‑этап в плане работ.
- **Описание:** После завершённой логики регистрации и входа в Backend‑план добавлена задача по server-side RBAC и безопасной привязке Telegram: права `USER`/`ADMIN`, назначение первого администратора, аудит изменений роли, одноразовые токены и webhook-верификация Telegram.
- **Измененные файлы:**
  - `docs/work_plan.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет.

## 2026-08-24

- **Задача:** Backend‑2 — регистрация и вход по паролю.
- **Описание:** Добавлены `POST /api/auth/register`, bcrypt-хеширование и Credentials Provider NextAuth.js. Регистрация нормализует email, проверяет входные данные, не возвращает пароль и обрабатывает конфликт уникальности. Вход проверяет bcrypt-хеш и активный статус пользователя, обновляет `lastLoginAt`, после чего формирует уже защищённую JWT-сессию. Роль добавляется в сессию для будущей серверной авторизации, однако Dashboard остаётся доступен и администраторам. Демо-формы заменены реальными запросами и тестами. Проверки: 13 Jest suites / 31 tests, `npx tsc --noEmit` и 3 целевых Playwright-сценария — успешно.
- **Измененные файлы:**
  - `app/api/auth/register/route.ts`, `app/api/health/route.ts`, `lib/prisma.ts`
  - `lib/auth/options.ts`, `lib/auth/users.ts`, `types/next-auth.d.ts`
  - `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`, связанные тесты и `jest.setup.ts`
  - `docs/architecture.md`, `docs/work_plan.md`, `docs/progress.md`, security-аудит
- **Новые переменные окружения:**
  - Нет.

## 2026-08-24

- **Задача:** Backend‑1 — аутентификация пользователей и сессии NextAuth.js.
- **Описание:** Добавлены обработчики NextAuth.js и JWT-сессии в HttpOnly cookie с `SameSite=Lax`, 8-часовым TTL и флагом `Secure` в production. Маршруты личного кабинета и администрирования проверяют сессию на сервере и перенаправляют неавторизованных пользователей на `/login`. Демо-вход удалён: реальная проверка пароля остаётся следующей backend-задачей. Проверки: `npx jest --runInBand` (11 suites, 24 tests), `npx tsc --noEmit` и 3 целевых Playwright-сценария — успешно.
- **Измененные файлы:**
  - `app/api/auth/[...nextauth]/route.ts`, `app/(dashboard)/layout.tsx`, `app/layout.tsx`
  - `components/auth/AuthSessionProvider.tsx`, `components/auth/LoginForm.tsx`, `components/core/Header.tsx`
  - `lib/auth/*`, `e2e/critical-flows.spec.ts`, `components/auth/__tests__/LoginForm.behavior.test.tsx`
  - `docs/architecture.md`, `docs/work_plan.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет; используется существующая приватная `NEXTAUTH_SECRET`.

## 2026-08-24

- **Задача:** Аудит секретов и перенос конфигурации Docker в корневой `.env`.
- **Описание:** Учётные данные PostgreSQL и MinIO удалены из `docker-compose.yml`; Compose получает их из переменных окружения. `.env` дополнен переменными локальной инфраструктуры и сессий, соответствующими Convertly Hub. Выполнен аудит исходников, Prisma и API-маршрута.
- **Измененные файлы:**
  - `.env`, `docker-compose.yml`
  - `docs/audits/security-audit-latest.md`, `docs/audits/security-audit-2026-08-24T08-35-01-368Z.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - `NODE_ENV`, `APP_DOMAIN`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MINIO_BUCKET`.

## 2026-08-22

- **Задача:** Интегрировать сервисный слой S3-совместимого хранилища с MinIO.
- **Описание:**
  - Добавлен `lib/storage/s3.ts`: ленивый серверный клиент AWS SDK v3 в MinIO path-style режиме, проверка доступности бакета и операции `uploadFile`, `downloadFile`, `deleteFile`.
  - Секреты остаются в приватных переменных окружения; сервис не формирует публичные URL и отклоняет пустые либо абсолютные ключи объектов.
  - Проверки: 5 unit-тестов с изолированным AWS SDK-моком, `npx tsc --noEmit`, а также реальный MinIO upload/download/delete с временным объектом — успешно.
- **Измененные файлы:**
  - `lib/storage/s3.ts`, `lib/storage/__tests__/s3.test.ts`
  - `docs/work_plan.md`, `docs/architecture.md`, `docs/tech_saas.md`, `START.md`, `README.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Необязательная `MINIO_BUCKET` (по умолчанию `convertly-files`).

## 2026-08-22

- **Задача:** Создать и применить миграцию финальной схемы данных.
- **Описание:**
  - Создана миграция `20260822120000_finalize_schema`: перечисления, модель `ApiKey`, метаданные конвертаций, индексы, хешированные auth-токены и каскадные связи приведены к текущей Prisma-схеме.
  - Перед применением проверено, что локальные таблицы `User` и `ConversionLog` пусты. Миграция применена через `npx prisma migrate deploy`.
  - Проверки: `npx prisma migrate status`, `npx prisma validate` и `npx prisma generate` — успешно. Для новых окружений документация использует `npx prisma migrate deploy`; `db push` больше не предлагается как способ синхронизации схемы.
- **Измененные файлы:**
  - `prisma/migrations/20260822120000_finalize_schema/migration.sql`
  - `docs/work_plan.md`, `docs/db-schema.md`, `docs/architecture.md`, `START.md`, `README.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Финализировать Prisma-схему для пользователей, API-ключей и истории конвертаций.
- **Описание:**
  - Добавлены перечисления ролей, статусов, тарифов и состояний конвертаций; расширены `User` и `ConversionLog`, добавлена модель `ApiKey`.
  - Настроены связи и индексы для истории пользователя, обработки очереди и аудита вызовов API; бинарные файлы остаются вне PostgreSQL и связываются через `storageKey` в S3.
  - API-ключи и одноразовые auth-токены спроектированы для хранения только в виде хешей; временные поля используют `timestamptz(3)`.
  - Проверки: `npx prisma format`, `npx prisma validate` и `npx prisma generate` — успешно. Последующая проверка `npm run build` также завершилась успешно; временная ошибка `EPERM` в `.next` не воспроизвелась. Миграция создана и применена отдельной задачей.
- **Измененные файлы:**
  - `prisma/schema.prisma`, `docs/db-schema.md`, `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Выполнить настройку и запуск локальной инфраструктуры PostgreSQL, MinIO и Gotenberg.
- **Описание:**
  - Проверены Docker Desktop и Compose; запущены сервисы `db`, `minio` и `gotenberg` из `docker-compose.yml`.
  - Проверки: PostgreSQL — `pg_isready` принимает подключения; MinIO — успешный liveness check; Gotenberg — Chromium и LibreOffice в статусе `up`; `npx prisma migrate status` подтвердил актуальность схемы.
  - Обновлены инструкция запуска, архитектурный статус и план работ. Пользовательские потоки конвертации, S3-хранения и аутентификации не изменялись.
- **Измененные файлы:**
  - `docs/work_plan.md`, `docs/architecture.md`, `START.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Добавить русскоязычные skills и правила для PostgreSQL и Prisma.
- **Описание:**
  - Созданы `database-migrations`, `postgres-patterns` и `prisma-patterns` для безопасных миграций, PostgreSQL-производительности и Prisma 7.
  - Добавлено правило `.codex/rules/local-database.md` с маршрутизацией задач базы данных и ограничениями на изменяющие команды.
  - `database-reviewer`, `AGENTS.md` и архитектурная документация связаны с новыми навыками.
- **Измененные файлы:**
  - `.codex/skills/database-migrations/SKILL.md`, `.codex/skills/postgres-patterns/SKILL.md`, `.codex/skills/prisma-patterns/SKILL.md`
  - `.codex/skills/database-reviewer/SKILL.md`, `.codex/rules/local-database.md`
  - `AGENTS.md`, `docs/architecture.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Добавить русскоязычный skill `database-reviewer` для PostgreSQL и Prisma.
- **Описание:**
  - Создан локальный навык для ревью схемы, миграций, запросов, индексов, транзакций и производительности PostgreSQL.
  - Навык учитывает Prisma 7 и ограничивает опасные команды БД требованием явного разрешения.
  - `AGENTS.md` и `docs/architecture.md` дополнены ссылками на навык.
- **Измененные файлы:**
  - `.codex/skills/database-reviewer/SKILL.md`
  - `AGENTS.md`, `docs/architecture.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Удалить конфигурации неиспользуемых coding agents.
- **Описание:**
  - Удалены `.claude/`, `.gemini/`, `.windsurf/`, а также корневые файлы `CLAUDE.md` и `GEMINI.md`.
  - Сохранены актуальные инструкции Codex (`.codex/`, `AGENTS.md`) и установленные Prisma skills (`.agents/`, `skills-lock.json`).
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Уточнить расположение component-тестов в архитектурной документации.
- **Описание:**
  - В `architecture.md` явно перечислены подпапки `components/*/__tests__` и их назначение.
  - Уточнено, что unit-, component- и UI-integration-тесты располагаются рядом с тестируемыми компонентами.
- **Измененные файлы:**
  - `docs/architecture.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Аудит фактического состояния проекта и актуализация документации.
- **Описание:**
  - Сверены `work_plan.md`, исходный код, маршруты, Prisma-схема, конфигурации и тесты.
  - Уточнено разграничение между готовым frontend-прототипом и запланированным backend: UI использует mock-данные, а NextAuth, конвертация, S3, API-ключи, платежи и серверное администрирование ещё не реализованы.
  - Исправлены неактуальные маршруты auth и инструкция запуска при занятом порте Gotenberg.
  - Проверки: `npm run build` — успешно; `npm run test:e2e` — 5 сценариев passed. `npm test -- --runInBand` не запустился из-за несовместимой передачи CLI-флага текущим npm; прямой `npx jest --runInBand` завершился с кодом 0 без диагностического вывода. Результат `npm run linteslint` в этой среде не был выведен исполнителем.
- **Измененные файлы:**
  - `README.md`, `START.md`
  - `docs/architecture.md`, `docs/tech_saas.md`, `docs/work_plan.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Внедрить E2E-тестирование критических frontend-сценариев.
- **Описание:**
  - Подключён Playwright с Chromium и командами `npm run test:e2e` / `npm run test:e2e:ui`.
  - Автоматизированы главная страница, вход, выбор тарифа и имитация оплаты, работа с историей конвертаций и управление пользователями.
  - Исправлена hydration-ошибка Dashboard: форматирование чисел теперь использует одинаковую локаль при SSR и в браузере.
  - Создан `docs/e2e_test_plan.md` с перечнем backend-зависимых сценариев, которые следует добавить после реализации серверных контрактов.
  - Проверки: `npm run test:e2e` — 5 сценариев passed; `npm test` — 9 suites / 18 tests passed; `npm run linteslint` и `npm run build` — успешно.
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Расширить тестовое покрытие существующего frontend-функционала.
- **Описание:**
  - Добавлены unit-, component- и integration-тесты для загрузки файлов, регистрации, модальных окон, оплаты, поиска, пагинации, API-ключей, приватности и управления пользователями.
  - Добавлена команда `npm run test:coverage` и dev-зависимость `msw` для изолированного мокирования будущих сетевых integration-тестов.
  - Обновлены `docs/architecture.md` и `docs/work_plan.md`: описана тестовая архитектура, а задача тестирования отмечена как частично выполненная — backend-покрытие остаётся в плане.
  - Проверки: `npm test` — 9 suites / 18 tests passed; `npm run test:coverage` — 88.52% statements; `npm run linteslint` и `npm run build` — успешно.
- **Измененные файлы:**
  - `package.json`, `package-lock.json`
  - `components/**/__tests__/*`
  - `docs/tech_saas.md`, `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-22

- **Задача:** Аудит миграции с Gemini Code Assist на Codex и актуализация инструкций проекта.
- **Описание:**
  - Проверен перенос правил: файлы из `.gemini/rules` сохранены в `.codex/rules` без расхождений. `DESIGN.md` оставлен только в корне как единственный канонический файл дизайн-системы.
  - `AGENTS.md` актуализирован для Codex: отражены только активные MCP (`context7`, `chrome-devtools`, `playwright`, `github`), добавлены Project Discovery, проверка изменений и путь к Prisma-навыкам, устранены ссылки на отсутствующие GitLab/Atlassian MCP и Gemini-специфичные имена инструментов.
  - Сохранены и уточнены разделы «Архитектурные задачи», «Жизненный цикл задач и Git Workflow» и «Тестирование»: новая ветка обязательна по умолчанию, кроме прямого указания пользователя работать без неё или в текущей ветке.
  - Проверки: `codex mcp list` — 4 сервера включены; `npm test` — 2 suites / 6 tests passed; `npm run build` — успешно. `npm run linteslint` не проходит: 11 существующих ошибок и 590 предупреждений (в основном настройки Tailwind), без изменений прикладного кода в рамках этой задачи.
- **Измененные файлы:**
  - `AGENTS.md`
  - `.gitignore`
  - `.codex/rules/local-verification.md`
  - `docs/progress.md`
- **Новые переменные окружения:**
  - Нет

## 2026-08-18

- **Задача:** Улучшение UI/UX и исправление багов.
- **Описание:**
  - Проведен рефакторинг шапки сайта: меню навигации перемещено в правую часть для улучшения пользовательского опыта.
  - Изменен маршрут админ-панели с `/admin` на `/management` для повышения безопасности.
  - Исправлен баг в меню пользователя на странице администрирования, из-за которого всплывающее окно не закрывалось при повторном клике.
  - Добавлен стиль `cursor: pointer` для всех кнопок на сайте через обновление базового компонента `Button`.
  - Исправлена проблема с переносом текста на кнопке "Confirm Telegram".
- **Измененные файлы:**
  - `convertly-hub/app/(dashboard)/admin/page.tsx` (переименован в `management/page.tsx`)
  - `convertly-hub/components/core/Header.tsx` (обновлена структура и ссылка на админ-панель)
  - `convertly-hub/components/admin/UserManagement.tsx` (исправлен баг с меню)
  - `convertly-hub/components/ui/Button.tsx` (добавлен `cursor: pointer`)
  - `convertly-hub/components/dashboard/UserProfile.tsx` (исправлен перенос текста)
- **Новые переменные окружения:**
  - Нет

## 2026-08-16

- **Задача:** Завершение и слияние ветки `feature/auth-payment-flow`.
- **Описание:**
  - Реализован полный цикл аутентификации и управления аккаунтом:
    - **Восстановление пароля:** Добавлены страницы для запроса на сброс и установки нового пароля. Реализована логика отправки токенов на почту.
    - **Верификация:** Добавлен механизм подтверждения почты и аккаунта Telegram.
    - **Оплата:** На странице с тарифами добавлено модальное окно для начала процесса оплаты.
    - **UX:** На странице "Forgot Password" ссылка "Назад" теперь ведет на предыдущую страницу.
  - Все изменения из ветки `feature/auth-payment-flow` были слиты в `main`.
  - Обновлена документация (`architecture.md`, `db-schema.md`, `work_plan.md`) для отражения новых функций.
- **Новые файлы:**
  - `convertly-hub/app/(auth)/password-reset/page.tsx`
  - `convertly-hub/app/(auth)/password-reset/[token]/page.tsx`
  - `convertly-hub/components/pricing/PaymentModal.tsx`
  - `convertly-hub/components/ui/Card.tsx`
  - `convertly-hub/components/ui/Input.tsx`
  - `convertly-hub/components/ui/Label.tsx`
  - `convertly-hub/prisma/migrations/20260816094436_auth_features/...`
- **Измененные файлы:**
  - `convertly-hub/prisma/schema.prisma` (расширена модель `User`)
  - `convertly-hub/docs/work_plan.md` (добавлен п.11)
  - `convertly-hub/docs/db-schema.md` (обновлена схема `User`)
  - `convertly-hub/docs/architecture.md` (обновлена структура папок и добавлены потоки аутентификации)
  - `convertly-hub/components/dashboard/UserProfile.tsx` (добавлена ссылка на сброс пароля и поле Telegram)
  - `convertly-hub/app/pricing/page.tsx` (интегрировано модальное окно оплаты)
- **Новые переменные окружения:**
  - Нет

## 2026-08-15 (v3)

- **Задача:** Frontend - 10. UI-компоненты: Создать переиспользуемые компоненты для уведомлений (Toasts), модальных окон и других элементов обратной связи.
- **Описание:**
  - Создана новая директория `components/ui` для хранения базовых UI-компонентов.
  - Созданы и интегрированы переиспользуемые компоненты: `Button`, `Modal`, `Pagination`, `Search`.
  - Добавлена библиотека `sonner` для toast-уведомлений и создан компонент `Toast`.
  - Внедрены toast-уведомления для различных действий пользователя: загрузка файлов, CRUD-операции с пользователями, управление API-ключами и т.д.
  - Исправлена ошибка с `asChild` пропом в компоненте `Button` с помощью `@radix-ui/react-slot`.
  - Исправлены ошибки в работе пагинации, связанные с некорректным использованием `useCallback`.
- **Новые файлы:**
  - `convertly-hub/components/ui/Button.tsx`
  - `convertly-hub/components/ui/Modal.tsx`
  - `convertly-hub/components/ui/Pagination.tsx`
  - `convertly-hub/components/ui/Search.tsx`
  - `convertly-hub/components/ui/Toast.tsx`
  - `convertly-hub/lib/hooks/use-toast.ts`
- **Удаленные файлы:**
  - `convertly-hub/components/core/Pagination.tsx`
- **Измененные файлы:**
  - `convertly-hub/docs/architecture.md` (актуализирована структура и добавлены UI-библиотеки)
  - `convertly-hub/package.json` (добавлены `sonner`, `cva`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`)
  - Множество компонентов были рефакторены для использования новых UI-компонентов.
- **Новые переменные окружения:**
  - Нет

## 2026-08-15 (v2)

- **Задача:** Рефакторинг и унификация стилей, улучшение пользовательского опыта и расширение функциональности Admin Panel и Dashboard.
- **Описание:**
  - Завершены все основные страницы: Главная, Dashboard, Admin, Pricing, Docs, Log In, Sign Up.
  - Проведена унификация стилей (кнопки, цвета) по всему приложению для обеспечения минималистичного дизайна.
  - Кнопка "Log Out" перемещена в заголовок для лучшей доступности.
  - Скорректирован цвет выделения "POST" на странице Docs.
  - Убрано цветное выделение маркеров списка в блоке "Included Features" на странице Dashboard.
  - Иконки загрузки SVG на Главной странице теперь синие.
  - Модальные окна теперь закрываются по нажатию Esc и клику вне окна.
  - **Admin Panel - User Management:**
    - Добавлена функциональность редактирования и удаления пользователей через всплывающее меню (три точки).
    - Реализовано подтверждение удаления пользователя.
    - Модальное окно редактирования пользователя включает поля: Name, Email, New Password, Role.
    - Добавлена сортировка пользователей по полям: Name, Role, Status, Last Login.
    - Улучшено удобство модальных окон (уже, закрытие по Esc/клику вне).
  - **Dashboard - Conversion History:**
    - Добавлены поиск по файлам, сортировка по полям и пагинация.
  - Все изменения объединены из ветки `refactor/unify-styles` в `main`.
- **Измененные файлы:**
  - `convertly-hub/docs/architecture.md` (актуализация структуры проекта)
  - `convertly-hub/components/core/Header.tsx` (перемещение кнопки Log Out)
  - Страницы и компоненты, связанные со стилями, модальными окнами, Admin Panel и Dashboard. (Конкретные файлы не перечислены, так как изменения затронули множество файлов по стилям).
- **Новые файлы:**
  - `convertly-hub/components/admin/EditUserModal.tsx`
  - `convertly-hub/components/core/ConfirmationModal.tsx`
- **Новые переменные окружения:**
  - Нет

## 2026-08-15

- **Задача:** Frontend - 9. Панель администратора: Спроектировать и реализовать интерфейс для управления пользователями и мониторинга системы.
- **Описание:**
  - Создана страница `/admin` с разделами для мониторинга системы и управления пользователями.
  - Разработаны компоненты `SystemMonitoring` и `UserManagement` с использованием моковых данных.
  - Добавлена ссылка "Admin" в шапку сайта.
- **Новые файлы:**
  - `convertly-hub/app/(dashboard)/admin/page.tsx`
  - `convertly-hub/components/admin/SystemMonitoring.tsx`
  - `convertly-hub/components/admin/UserManagement.tsx`
- **Измененные файлы:**
  - `convertly-hub/components/core/Header.tsx`
- **Новые переменные окружения:**
  - Нет

## 2026-08-12 (v5)

- **Задача:** Frontend - 8. Документация API (/docs): Создать страницу с документацией API.
- **Описание:**
  - Создана страница с документацией API, согласно п.8 `work_plan.md`.
- **Новые файлы:**
  - `convertly-hub/app/docs/page.tsx` (создан)
- **Измененные файлы:**
  - `convertly-hub/docs/architecture.md` (актуализация архитектуры)
  - `convertly-hub/docs/work_plan.md` (задача 8 отмечена как выполненная)
- **Новые переменные окружения:**
  - Нет

## 2026-08-12 (v4)

- **Задача:** Frontend - 7. Прайс (/pricing): Создать страницу с тарифами.
- **Описание:**
  - Создана страница с тарифами, согласно п.7 `work_plan.md`.
- **Новые файлы:**
  - `convertly-hub/app/pricing/page.tsx` (создан)
- **Измененные файлы:**
  - `convertly-hub/docs/work_plan.md` (задача 7 отмечена как выполненная)
- **Новые переменные окружения:**
  - Нет

## 2026-08-12 (v3)

- **Задача:** Frontend - 6. Страница 404: Создать дизайн для страницы 404 в стиле всего проекта.
- **Описание:**
  - Создана страница 404, согласно п.6 `work_plan.md`.
  - Дизайн страницы соответствует гайдлайнам из `DESIGN.md`.
- **Новые файлы:**
  - `convertly-hub/app/not-found.tsx` (создан)
- **Измененные файлы:**
  - Нет
- **Новые переменные окружения:**
  - Нет

## 2026-08-12 (v2)

- **Задача:** Frontend - 5. Личный кабинет (/dashboard): Разработаны компоненты для страницы личного кабинета, согласно п.5 `work_plan.md`.
- **Описание:**
  - Созданы компоненты `UserProfile`, `ApiKeyManager`, `PrivacySettings`, и `ConversionHistory` для управления профилем, API-ключами, настройками приватности и просмотра истории конвертаций.
  - Реализована базовая структура страницы `/dashboard` с использованием моковых данных.
  - Исправлена критическая ошибка импорта `useState` в `ApiKeyManager.tsx`, которая блокировала рендеринг страницы.
- **Новые файлы:**
  - `convertly-hub/app/(dashboard)/dashboard/page.tsx` (создан)
  - `convertly-hub/app/(dashboard)/layout.tsx` (создан)
  - `convertly-hub/components/dashboard/UserProfile.tsx` (создан)
  - `convertly-hub/components/dashboard/ApiKeyManager.tsx` (создан)
  - `convertly-hub/components/dashboard/PrivacySettings.tsx` (создан)
  - `convertly-hub/components/dashboard/ConversionHistory.tsx` (создан)
- **Измененные файлы:**
  - `convertly-hub/docs/work_plan.md` (задача 5 отмечена как выполненная)
- **Новые переменные окружения:**
  - Нет

## 2026-08-12

- **Задача:** Настройка ESLint, Prettier и Tailwind CSS для проекта Convertly Hub. Внедрение eslint-plugin-tailwindcss и устранение проблем с его конфигурацией.
- **Описание:**
  - Настроена интеграция `eslint-plugin-tailwindcss` для корректной работы с Tailwind CSS v4 и ESLint 9.
  - Добавлен `convertly-hub/src/style.css` как временное решение (костыль) для обхода бага в `eslint-plugin-tailwindcss`, который некорректно обрабатывает путь к файлам стилей. Этот файл импортирует `../app/globals.css`, чтобы линтер мог корректно читать CSS-переменные.
  - Исправлена ошибка `react/no-unescaped-entities` в `app/(auth)/login/page.tsx` путем экранирования апострофа (`'`) как `&apos;`.
  - Подтверждено, что удаление `eslintConfig` из `eslint.config.mjs` не имеет побочных эффектов, так как эта переменная не использовалась вне файла.
- **Измененные файлы:**
  - `convertly-hub/package.json` (добавлены скрипты `linteslint` и `linteslint:fix`, добавлены зависимости `eslint-plugin-tailwindcss`, `postcss`, `prettier`, `prettier-plugin-tailwindcss`)
  - `convertly-hub/.prettierrc` (обновлены настройки для Tailwind CSS)
  - `convertly-hub/eslint.config.mjs` (обновлена конфигурация ESLint для поддержки `eslint-plugin-tailwindcss`)
  - `convertly-hub/src/style.css` (создан как временный файл)
  - `convertly-hub/app/(auth)/login/page.tsx` (исправлена ошибка экранирования символов)
- **Новые переменные окружения:**
  - Нет

## 2026-08-10 (v7)

- **Задача:** UI/UX - Улучшение консистентности и исправление ошибок в UI.
- **Описание:** Выполнены правки в шапке и на главных страницах для улучшения пользовательского опыта. Устранены проблемы с высотой страниц, видимостью кнопок и отступами.
- **Измененные файлы:**
  - `convertly-hub/components/core/Header.tsx`: Скорректированы стили кнопок "Log In" и "Sign Up" для desktop и mobile версий, улучшена их видимость и добавлены hover-эффекты. Мобильное меню теперь отображает кнопки в один ряд.
  - `convertly-hub/app/page.tsx`: Главная страница теперь занимает всю высоту экрана с центрированным контентом, как на страницах входа и регистрации.
  - `convertly-hub/app/(auth)/login/page.tsx`: Проверена консистентность верстки.
  - `convertly-hub/app/(auth)/register/page.tsx`: Проверена консистентность верстки.
- **Новые переменные окружения:**
  - Нет

## 2026-08-10 (v6)

- **Задача:** Frontend - 4. Аутентификация: Созданы страницы и формы для регистрации и входа, согласно п.4 `work_plan.md`.
- **Новые файлы:**
  - `convertly-hub/app/(auth)/login/page.tsx` (создан)
  - `convertly-hub/app/(auth)/register/page.tsx` (создан)
  - `convertly-hub/components/auth/LoginForm.tsx` (создан)
  - `convertly-hub/components/auth/RegisterForm.tsx` (создан)
- **Измененные файлы:**
  - Нет
- **Новые переменные окружения:**
  - Нет

## 2026-08-10 (v5)

- **Задача:** Frontend - 3. Главная страница: Реализованы виджеты Drag & Drop для конвертации файлов, согласно п.3 `work_plan.md`.
- **Новые файлы:**
  - `convertly-hub/components/core/FileDropzone.tsx` (создан)
- **Измененные файлы:**
  - `convertly-hub/app/page.tsx` (интегрированы виджеты Drag & Drop)
  - `convertly-hub/package.json` (добавлены `react-dropzone` и `lucide-react`)
- **Новые переменные окружения:**
  - Нет

## 2026-08-10 (v4)

- **Задача:** Frontend - 2. Основной макет: Создан корневой layout с навигацией и футером, согласно п.2 `work_plan.md`.
- **Новые файлы:**
  - `convertly-hub/components/core/Header.tsx` (создан)
  - `convertly-hub/components/core/Footer.tsx` (создан)
- **Измененные файлы:**
  - `convertly-hub/app/layout.tsx` (добавлены Header и Footer)
- **Новые переменные окружения:**
  - Нет

## 2026-08-10 (v3)

- **Задача:** Настройка ESLint и Prettier для обеспечения качества кода, согласно п.1 раздела "Прочие задачи" в `work_plan.md`.
- **Новые файлы:**
  - `convertly-hub/eslint.config.mjs` (создан)
  - `convertly-hub/.prettierrc` (создан)
  - `convertly-hub/.prettierignore` (создан)
- **Измененные файлы:**
  - `convertly-hub/package.json` (добавлены `eslint`, `prettier` и плагины)
- **Новые переменные окружения:**
  - Нет

## 2026-08-10 (v2)

- **Задача:** Настройка основы фронтенд-приложения согласно п.1 `work_plan.md`. Настроен Tailwind CSS и базовые стили.
- **Новые файлы:**
  - `convertly-hub/tailwind.config.ts` (создан)
- **Измененные файлы:**
  - `convertly-hub/app/globals.css` (обновлен для соответствия `DESIGN.md`)
  - `convertly-hub/app/layout.tsx` (обновлен для использования кастомных шрифтов и стилей)
- **Новые переменные окружения:**
  - Нет

## 2026-08-10

- **Задача:** Сгенерирован план выполнения работ на основе `tech_saas.md`, `architecture.md` и `db-schema.md`.
- **Новые файлы:**
  - `convertly-hub/docs/work_plan.md` (создан)
- **Измененные файлы:**
  - Нет
- **Новые переменные окружения:**
  - Нет

## 2026-08-10

- **Задача:** Обновлен `AGENTS.md` согласно запросу пользователя. Исправлены инструкции "Быстрый запуск", детализирована секция "Работа со стилями", объединены дублирующиеся разделы.
- **Измененные файлы:**
  - `convertly-hub/AGENTS.md` (обновлен)
- **Новые переменные окружения:**
  - Нет

## 2026-08-09 (у5)

- **Задача:** Проведен аудит безопасности кодовой базы. Выявлены критические и другие уязвимости.
- **Новые файлы:**
- 'docs/audits/security-audit-2026-08-09.md' (создан)
- **Измененные файлы:**
- 'docs/progress.md' (обновлен)
- **Новые переменные окружения:**
- Нет

## 2026-08-09 (v4)

- **Задача:** Адаптация и интеграция нового навыка `security-review`. Проанализирован `SKILL.md`, который уже соответствует структуре проекта. `AGENTS.md` проверен и содержит корректную информацию о новом навыке.
- **Измененные файлы:**
  - `docs/progress.md` (обновлен)
- **Новые переменные окружения:**
  - Нет

## 2026-08-09 (v3)

- **Задача:** Анализ структуры проекта и обновление документации. `db-schema.md` обновлен для отражения текущей схемы Prisma. `architecture.md` скорректирован для соответствия реальной структуре папок.
- **Измененные файлы:**
  - `docs/db-schema.md` (обновлен)
  - `docs/architecture.md` (обновлен)
- **Новые переменные окружения:**
  - Нет

## 2026-08-09 (v2)

- **Задача:** Проведен повторный аудит API.
- **Измененные файлы:**
  - `docs/audits/api-audit-latest.md` (обновлен)
- **Новые переменные окружения:**
  - Нет

## 2026-08-09

- **Задача:** Обновлен скрипт аудита API для проверки новых эндпоинтов. Обновлен `AGENTS.md` для отражения изменений в API. Проведен аудит API.
- **Измененные файлы:**
  - `scripts/audit-api.mjs` (обновлен)
  - `AGENTS.md` (обновлен)
  - `docs/audits/api-audit-latest.md` (обновлен)
- **Новые переменные окружения:**
  - Нет

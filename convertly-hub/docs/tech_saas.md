# ⚙️ Convertly Hub — технологии и актуальный статус SaaS

Convertly Hub — веб-сервис и API для конвертации файлов. Этот документ описывает
**фактически реализованный локальный MVP** и допустимые варианты следующего
production-этапа. Подробные маршруты и потоки приведены в
[architecture.md](./architecture.md), а состояние задач — в
[work_plan.md](./work_plan.md).

> **Статус на 2 сентября 2026:** локальный MVP реализован и покрыт unit/route,
> browser E2E и реальным backend integration/E2E-набором. Публичный production
> ещё не развёрнут. Предпочтительный целевой вариант — один Oracle A1 server;
> планы для Vercel и Render подготовлены как альтернативы, но не являются
> готовой production-конфигурацией.

---

## 1. Возможности MVP

### Конвертация и хранение

- `JPG ↔ PNG` выполняется библиотекой `sharp`.
- `DOCX → PDF` выполняется изолированным сервисом Gotenberg.
- `PDF → DOCX` остаётся запланированным: это не обратимое преобразование и
  требует отдельного best-effort конвертера и оценки качества.
- Результаты авторизованного пользователя могут сохраняться в приватном
  S3-совместимом хранилище или отдаваться без хранения согласно privacy-настройке.
  Доступ к сохранённому файлу даётся только через защищённый download endpoint.
- Гость может без регистрации выполнить до 3 image- и 2 document-конвертаций в
  календарный месяц. Размер файла — до 1 MB; гостевые файлы не попадают в БД и
  S3, доступны в браузере до 10 минут и исчезают при очистке данных браузера.
- Для аккаунтов действуют квоты выбранного тарифа: число успешных конвертаций,
  размер одного файла, объём и срок хранения результатов. Актуальные значения
  отображаются на странице `/pricing` и контролируются сервером.

### Аккаунты и доступ

- NextAuth v4 использует JWT-сессии в HttpOnly cookies.
- Credentials-вход хранит только bcrypt-хеш пароля. Email verification и password
  reset используют одноразовые хешированные токены и SMTP.
- Роли: `USER` и `ADMIN`. Dashboard доступен обеим ролям; `/management` — только
  `ADMIN`.
- Telegram linking реализован через одноразовую ссылку. Рабочий Telegram-reset
  пока остаётся отдельной задачей.
- API-ключ показывается пользователю ровно один раз при создании; в базе хранится
  только SHA-256-хеш. API доступно тарифам, которые его предусматривают.

### API и контроль качества

- Основной API: `POST /api/v1/convert`; скачивание сохранённого результата:
  `GET /api/v1/conversions/:conversionId/download`.
- API и browser-конвертация валидируют разрешённые форматы, размер и сигнатуры
  файлов на сервере. Внешнему MIME-типу доверять нельзя.
- Реализован in-memory rate limiter. Для нескольких app instances потребуется
  отдельный Redis-совместимый общий backend.
- `GET /api/health` проверяет приложение, PostgreSQL, S3 и Gotenberg.

---

## 2. Реализованный стек

| Зона            | Технологии и назначение                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| Web/API         | Next.js 16 (App Router), React 19, TypeScript, Route Handlers                                |
| UI              | Tailwind CSS 4, собственные компоненты и `sonner` для уведомлений                            |
| Аутентификация  | NextAuth 4, bcrypt, HttpOnly cookies, Nodemailer 9                                           |
| Данные          | PostgreSQL 15, Prisma 7.10 с `@prisma/adapter-pg`                                            |
| Хранилище       | AWS SDK v3, S3-compatible API; локально — MinIO                                              |
| Конвертация     | `sharp` для изображений, Gotenberg 8 для `DOCX → PDF`                                        |
| Локальная почта | MailHog; он предназначен только для разработки и тестов                                      |
| Проверки        | ESLint, TypeScript, Prettier, Jest, Playwright, Docker Compose integration/E2E               |
| CI              | GitHub Actions на push в любую ветку: lint/types/Jest, browser E2E, реальные integration/E2E |

`npm audit --omit=dev` проходит без уязвимостей. Prisma 7.10 и Nodemailer 9.1
обновлены адресно; NextAuth остаётся на стабильной v4. Любое его major-обновление
требует отдельной проверки breaking changes и полного набора тестов —
`npm audit fix --force` для этого проекта запрещён.

---

## 3. Среды и инфраструктура

### Локальная разработка

`docker compose up -d` поднимает PostgreSQL, MinIO, Gotenberg и MailHog. Next.js
запускается на хосте через `npm run dev`. Полный пошаговый сценарий, диагностика,
миграции и первый администратор описаны в [local-start.md](./local-start.md).

Изолированные реальные integration/E2E используют отдельный Compose-стек,
отдельную БД, bucket и порт. Они не изменяют локальные данные:

```bash
npm run test:integration
```

### Oracle Cloud Free Tier — предпочтительный production-вариант

Один отдельный ARM64 instance Oracle A1 в Frankfurt размещает Caddy, Next.js,
PostgreSQL, MinIO и Gotenberg в одной private Docker-сети. Снаружи открыты только
`80` и `443`; данные остаются в persistent volumes. Production использует реальный
SMTP `support@bon.kharkov.ua`, а не MailHog.

Это единственный уже подготовленный deployment-контур репозитория:
`Dockerfile`, `docker-compose.production.yml`, `deploy/Caddyfile` и
`.env.production.example`. Практический порядок —
[oracle-production-deployment.md](./oracle-production-deployment.md).

До public go-live обязательны реальная VM, DNS, SMTP preflight, off-host backup и
проверка восстановления. Free Tier capacity в Oracle не гарантирована: если A1
недоступен в выбранном AD, это внешнее ограничение, а не ошибка конфигурации.

### Vercel Pro — serverless-альтернатива

Vercel не запускает текущий Compose-стек как единый server. Для этого варианта
нужны управляемые PostgreSQL и S3-compatible storage, а Gotenberg — отдельный
закрытый worker. Необходимо дополнительно спроектировать безопасную связь между
Vercel и worker до публикации. План без изменений в аккаунтах и коде находится в
[vercel-production-deployment.md](./vercel-production-deployment.md).

### Render — container-альтернатива

Render Paid может разместить Next.js и приватный Gotenberg как разные services;
PostgreSQL и S3-хранилище лучше использовать управляемые/внешние. Это более близко
к текущему Docker-подходу, но не является single-instance Free Tier вариантом.

Render Free + MailHog годится лишь для ограниченного временного demo/preview:
ограничения free services не позволяют безопасно и надёжно развернуть весь текущий
контур конвертации. Он не заменяет production SMTP, persistent storage, private
Gotenberg и backup. Подробности и контрольные точки —
[render-production-deployment.md](./render-production-deployment.md).

### Northflank Free + Supabase Free — функциональный demo

Для временного публичного demo доступен отдельный вариант: две Northflank services
(`Next.js` public и `Gotenberg` private) и один Supabase project для PostgreSQL и
S3-compatible Storage. Он избегает объединения MinIO/Gotenberg, но остаётся
демо-контуром: Northflank Free не предназначен для production, а Supabase Free
может приостановить project при низкой активности. Пошаговый порядок, включая
GitHub build context `convertly-hub`, находится в
[northflank-supabase-demo.md](./northflank-supabase-demo.md).

---

## 4. Политика production-секретов и данных

- Секреты никогда не коммитятся. Локально они находятся только в корневом `.env`,
  а в облаке — в защищённом secrets/env-хранилище выбранного провайдера.
- `.env.example` и `.env.production.example` содержат только имена переменных и
  безопасные шаблоны, не реальные значения.
- `NEXTAUTH_SECRET`, пароли PostgreSQL/MinIO/SMTP и API credentials должны быть
  разными для локальной, preview и production-сред.
- Production database, object storage и Gotenberg не должны иметь публичных
  портов. Файлы не выдаются через public bucket URL.
- MailHog нельзя использовать для реальных пользователей: он не доставляет
  письма наружу и не предназначен для защиты production-данных.
- До приёма пользовательских файлов проверяется восстановление PostgreSQL и
  S3-бэкапа вне самого production host.

---

## 5. Что ещё не является production-ready

1. Реальные платежи и billing webhooks; текущая checkout-модалка — mock.
2. `PDF → DOCX`.
3. Redis/распределённый rate limiter для горизонтального масштаба.
4. Полная админская история конвертаций, включая фильтр `FAILED`, детали ошибки и
   операции с файлами.
5. Автоматические off-host backup/restore, внешний monitoring/alerting и CD.
6. Telegram-reset flow.

Порядок и причины отложенных работ описаны в верхнем блоке
[work_plan.md](./work_plan.md). Перед любым public запуском также повторно
проверяются GitHub Actions, `npm audit --omit=dev` и production smoke-tests.

---

## 6. Документы для работы

- [Архитектура и API-контракты](./architecture.md)
- [Локальный старт](./local-start.md)
- [Реальные backend integration/E2E](./integration-tests.md)
- [Oracle Cloud Free Tier runbook](./oracle-production-deployment.md)
- [Vercel Pro runbook-план](./vercel-production-deployment.md)
- [Render Paid / Free demo runbook-план](./render-production-deployment.md)
- [Northflank Free + Supabase Free demo MVP](./northflank-supabase-demo.md)
- [Подробные руководства по слоям](./guides/README.md)
- [План работ](./work_plan.md)

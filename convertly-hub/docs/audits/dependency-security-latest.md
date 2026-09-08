# Dependency security update — 2026-09-08

## Выполненное адресное обновление

| Пакет                | Было                | Стало             | Решение                                                       |
| -------------------- | ------------------- | ----------------- | ------------------------------------------------------------- |
| `prisma`             | 7.9.1               | 7.10.0            | Стабильный patch/minor в линии Prisma 7.                      |
| `@prisma/client`     | 7.9.1               | 7.10.0            | Обновлён синхронно с CLI.                                     |
| `@prisma/adapter-pg` | 7.9.1               | 7.10.0            | Обновлён синхронно с Client.                                  |
| `deepmerge-ts`       | 7.1.5 (transitive)  | 8.0.0 (override)  | Устраняет GHSA-ggr8-5vv4-36mx до upstream-исправления Prisma. |
| `nodemailer`         | 7.0.13              | 9.1.0             | Закрывает advisories; проверен с реальным MailHog.            |
| `fast-uri`           | 3.1.5 (transitive)  | 3.1.6 (override)  | Закрывает актуальные host-confusion/SSRF advisories.          |
| `mysql2`             | 3.15.3 (transitive) | 3.23.1 (override) | Закрывает auth-downgrade и compressed-protocol advisories.    |

`package.json` содержит четыре узких overrides:

- `deepmerge-ts = "8.0.0"` нужен только пока `@prisma/config` Prisma 7 фиксирует
  уязвимую версию; проверять возможность удаления при каждом обновлении Prisma;
- `next-auth.nodemailer = "$nodemailer"` явно связывает optional peer NextAuth v4
  с корневым Nodemailer 9.1.0. Это сохраняет строгий `npm ci` без `--force` и
  `--legacy-peer-deps`; повторно проверить его при обновлении NextAuth.
- `fast-uri = "3.1.6"` и `mysql2 = "3.23.1"` заменяют версии, которые Prisma 7
  фиксирует в своём dependency graph. Оба override остаются в одной major-линии;
  при обновлении Prisma проверить `npm ls prisma fast-uri mysql2` и удалить
  override, если upstream перестанет закреплять уязвимую версию.

## Результат audit

До адресных обновлений `npm audit --omit=dev` сообщал 5 finding: 4 high и 1
moderate. После ранних обновлений 1 сентября результат был временно чистым, но
новые advisories 8 сентября обнаружили `fast-uri@3.1.5` и `mysql2@3.15.3` в
Prisma-транзитивном графе. После добавления совместимых overrides повторные
`npm audit --omit=dev` и полный install-audit возвращают **0 vulnerabilities**.

Не используйте `npm audit fix --force` как замену этой процедуры: оно может
сменить major-версию Prisma или NextAuth. При новом finding сначала определите
путь зависимости, выберите совместимый patch/minor или узкий override и
выполните полный набор проверок.

## Совместимость Auth/email и дальнейшие проверки

- `next-auth@4.24.15` остаётся на последней стабильной v4; v5 не используется, пока
  не выйдет стабильный релиз и не будет отдельно спланирована миграция.
- NextAuth v4 указывает Nodemailer 7 как **необязательную** peer dependency. В
  Convertly Hub применяется только `CredentialsProvider`; email-сообщения отправляет
  собственный SMTP-модуль `lib/mail/send-auth-email.ts`, а не NextAuth Email Provider.
  Поэтому Nodemailer 9.1.0 обновлён без `--force` и подтверждён реальной доставкой
  registration verification-письма в MailHog в integration/E2E. `npm ci --dry-run
--ignore-scripts` подтверждает воспроизводимое peer-разрешение для CI.
- При любом будущем обновлении NextAuth повторить Credentials-сессию, password reset,
  email verification, SMTP integration/E2E и `npm audit --omit=dev`. Не добавлять
  NextAuth Email Provider к этой связке без отдельной проверки совместимости или
  миграции на стабильный Auth.js/NextAuth с поддержкой Nodemailer 9.

Prisma 8 также не входит в этот этап: это major-переход с отдельной моделью Client,
query API и миграций. Prisma 7 остаётся выбранной production-линией до отдельного
спланированного upgrade.

## Проверки после обновления

- `npx prisma generate` — Prisma Client 7.10.0 сгенерирован;
- `npx prisma validate` — схема валидна в последней полной проверке;
- `npx tsc --noEmit`, `npm run linteslint` и Prettier — успешно;
- `npm test -- --runInBand` — 52 suites / 159 tests успешно;
- `npm run build` — production build успешно;
- `npm ls prisma @prisma/client mysql2 fast-uri --all` подтверждает Prisma 7.10.0,
  `fast-uri@3.1.6 overridden` и `mysql2@3.23.1 overridden`.

Локальный Docker migration-target в этой проверке не запускался, поскольку
Docker Desktop daemon был выключен. Это не меняет Dockerfile; GitHub Actions и
Northflank выполняют свой чистый `npm ci` по `package-lock.json`.

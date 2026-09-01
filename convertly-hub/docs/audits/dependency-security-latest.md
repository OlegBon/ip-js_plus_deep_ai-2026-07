# Dependency security update — 2026-09-01

## Выполненное адресное обновление

| Пакет                | Было               | Стало            | Решение                                                       |
| -------------------- | ------------------ | ---------------- | ------------------------------------------------------------- |
| `prisma`             | 7.9.1              | 7.10.0           | Стабильный patch/minor в линии Prisma 7.                      |
| `@prisma/client`     | 7.9.1              | 7.10.0           | Обновлён синхронно с CLI.                                     |
| `@prisma/adapter-pg` | 7.9.1              | 7.10.0           | Обновлён синхронно с Client.                                  |
| `deepmerge-ts`       | 7.1.5 (transitive) | 8.0.0 (override) | Устраняет GHSA-ggr8-5vv4-36mx до upstream-исправления Prisma. |
| `nodemailer`         | 7.0.13             | 9.1.0            | Закрывает advisories; проверен с реальным MailHog.            |

`package.json` содержит два узких overrides:

- `deepmerge-ts = "8.0.0"` нужен только пока `@prisma/config` Prisma 7 фиксирует
  уязвимую версию; проверять возможность удаления при каждом обновлении Prisma;
- `next-auth.nodemailer = "$nodemailer"` явно связывает optional peer NextAuth v4
  с корневым Nodemailer 9.1.0. Это сохраняет строгий `npm ci` без `--force` и
  `--legacy-peer-deps`; повторно проверить его при обновлении NextAuth.

## Результат audit

До обновления `npm audit --omit=dev` сообщал 5 finding: 4 high и 1 moderate.
После адресных обновлений `npm audit --omit=dev` сообщает **0 vulnerabilities**.

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
- `npx prisma validate` — схема валидна;
- `npx prisma migrate status` — 9 миграций, схема локальной БД актуальна;
- `npm test -- --runInBand --forceExit` — успешно;
- `npm run test:e2e` — 5 passed;
- `npm run test:integration` — 1 passed, временный Compose-контур удалён;
- integration/E2E дополнительно подтверждает реальную SMTP-доставку verification
  email в MailHog;
- `npx tsc --noEmit`, `npm run linteslint` и Prettier — успешно.

Локальный `npm run build` не является сигналом регрессии этой зависимости: он
останавливается на недоступности `fonts.googleapis.com`. Production build проходит
в GitHub Actions при обычном сетевом доступе.

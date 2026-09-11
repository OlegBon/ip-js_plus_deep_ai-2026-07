# Dependency security update — 2026-09-01

## Виконане адресне оновлення

| Пакет                | Було               | Стало            | Рішення                                                       |
| -------------------- | ------------------ | ---------------- | ------------------------------------------------------------- |
| `prisma`             | 7.9.1              | 7.10.0           | Стабільний patch/minor у лінійці Prisma 7.                    |
| `@prisma/client`     | 7.9.1              | 7.10.0           | Оновлено синхронно з CLI.                                     |
| `@prisma/adapter-pg` | 7.9.1              | 7.10.0           | Оновлено синхронно з Client.                                  |
| `deepmerge-ts`       | 7.1.5 (transitive) | 8.0.0 (override) | Усуває GHSA-ggr8-5vv4-36mx до upstream-виправлення Prisma.    |
| `nodemailer`         | 7.0.13             | 9.1.0            | Закриває advisories; перевірено з реальним MailHog.           |

`package.json` містить два вузькі overrides:

- `deepmerge-ts = "8.0.0"` потрібен лише поки `@prisma/config` Prisma 7 фіксує
  вразливу версію; перевіряти можливість видалення за кожного оновлення Prisma;
- `next-auth.nodemailer = "$nodemailer"` явно пов'язує optional peer NextAuth v4
  з кореневим Nodemailer 9.1.0. Це зберігає строгий `npm ci` без `--force` і
  `--legacy-peer-deps`; повторно перевірити його за оновлення NextAuth.

## Результат audit

До оновлення `npm audit --omit=dev` повідомляв про 5 finding: 4 high і 1 moderate.
Після адресних оновлень `npm audit --omit=dev` повідомляє **0 vulnerabilities**.

## Сумісність Auth/email і подальші перевірки

- `next-auth@4.24.15` залишається на останній стабільній v4; v5 не використовується, доки
  не вийде стабільний реліз і не буде окремо спланована міграція.
- NextAuth v4 вказує Nodemailer 7 як **необов'язкову** peer dependency. У
  Convertly Hub застосовує лише `CredentialsProvider`; email-повідомлення надсилає
  власний SMTP-модуль `lib/mail/send-auth-email.ts`, а не NextAuth Email Provider.
  Тому Nodemailer 9.1.0 оновлено без `--force` і підтверджено реальною доставкою
  registration verification-листа до MailHog в integration/E2E. `npm ci --dry-run
--ignore-scripts` підтверджує відтворюване peer-вирішення для CI.
- За будь-якого майбутнього оновлення NextAuth повторити Credentials-сесію, password reset,
  email verification, SMTP integration/E2E та `npm audit --omit=dev`. Не додавати
  NextAuth Email Provider до цієї зв'язки без окремої перевірки сумісності або
  міграції на стабільний Auth.js/NextAuth із підтримкою Nodemailer 9.

Prisma 8 також не входить до цього етапу: це major-перехід з окремою моделлю Client,
query API та міграцій. Prisma 7 залишається обраною production-лінійкою до окремо
спланованого upgrade.

## Перевірки після оновлення

- `npx prisma generate` — Prisma Client 7.10.0 згенеровано;
- `npx prisma validate` — схема валідна;
- `npx prisma migrate status` — 9 міграцій, схема локальної БД актуальна;
- `npm test -- --runInBand --forceExit` — успішно;
- `npm run test:e2e` — 5 passed;
- `npm run test:integration` — 1 passed, тимчасовий Compose-контур видалено;
- integration/E2E додатково підтверджує реальну SMTP-доставку verification
  email до MailHog;
- `npx tsc --noEmit`, `npm run linteslint` і Prettier — успішно.

Локальний `npm run build` не є сигналом регресії цієї залежності: він
зупиняється на недоступності `fonts.googleapis.com`. Production build проходить
у GitHub Actions за звичайного мережевого доступу.

# Dependency security update — 2026-09-08

## Виконане адресне оновлення

| Пакет                | Було                | Стало             | Рішення                                                       |
| -------------------- | ------------------- | ----------------- | ------------------------------------------------------------- |
| `prisma`             | 7.9.1               | 7.10.0            | Стабільний patch/minor у лінійці Prisma 7.                    |
| `@prisma/client`     | 7.9.1               | 7.10.0            | Оновлено синхронно з CLI.                                     |
| `@prisma/adapter-pg` | 7.9.1               | 7.10.0            | Оновлено синхронно з Client.                                  |
| `deepmerge-ts`       | 7.1.5 (transitive)  | 8.0.0 (override)  | Усуває GHSA-ggr8-5vv4-36mx до upstream-виправлення Prisma.    |
| `nodemailer`         | 7.0.13              | 9.1.0             | Закриває advisories; перевірено з реальним MailHog.           |
| `fast-uri`           | 3.1.5 (transitive)  | 3.1.6 (override)  | Закриває актуальні host-confusion/SSRF advisories.            |
| `mysql2`             | 3.15.3 (transitive) | 3.23.1 (override) | Закриває auth-downgrade та compressed-protocol advisories.    |

`package.json` містить чотири вузькі overrides:

- `deepmerge-ts = "8.0.0"` потрібен лише поки `@prisma/config` Prisma 7 фіксує
  вразливу версію; перевіряти можливість видалення за кожного оновлення Prisma;
- `next-auth.nodemailer = "$nodemailer"` явно пов'язує optional peer NextAuth v4
  з кореневим Nodemailer 9.1.0. Це зберігає строгий `npm ci` без `--force` і
  `--legacy-peer-deps`; повторно перевірити його за оновлення NextAuth.
- `fast-uri = "3.1.6"` і `mysql2 = "3.23.1"` замінюють версії, які Prisma 7
  фіксує у своєму dependency graph. Обидва override залишаються в одній major-лінійці;
  за оновлення Prisma перевірити `npm ls prisma fast-uri mysql2` і видалити
  override, якщо upstream перестане фіксувати вразливу версію.

## Результат audit

До адресних оновлень `npm audit --omit=dev` повідомляв про 5 finding: 4 high і 1
moderate. Після ранніх оновлень 1 вересня результат був тимчасово чистим, але
нові advisories 8 вересня виявили `fast-uri@3.1.5` і `mysql2@3.15.3` у
Prisma-транзитивному графі. Після додавання сумісних overrides повторні
`npm audit --omit=dev` і повний install-audit повертають **0 vulnerabilities**.

Не використовуйте `npm audit fix --force` як заміну цієї процедури: воно може
змінити major-версію Prisma або NextAuth. За нового finding спочатку визначте
шлях залежності, оберіть сумісний patch/minor або вузький override та
виконайте повний набір перевірок.

## Сумісність Auth/email і подальші перевірки

- `next-auth@4.24.15` залишається на останній стабільній v4; v5 не використовується, поки
  не вийде стабільний реліз і не буде окремо спланована міграція.
- NextAuth v4 вказує Nodemailer 7 як **необов'язкову** peer dependency. У
  Convertly Hub застосовується лише `CredentialsProvider`; email-повідомлення надсилає
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
- `npx prisma validate` — схема валідна в останній повній перевірці;
- `npx tsc --noEmit`, `npm run linteslint` і Prettier — успішно;
- `npm test -- --runInBand` — 52 suites / 159 tests успішно;
- `npm run build` — production build успішно;
- `npm ls prisma @prisma/client mysql2 fast-uri --all` підтверджує Prisma 7.10.0,
  `fast-uri@3.1.6 overridden` и `mysql2@3.23.1 overridden`.

Локальний Docker migration-target у цій перевірці не запускався, оскільки
Docker Desktop daemon було вимкнено. Це не змінює Dockerfile; GitHub Actions і
Northflank виконують свій чистий `npm ci` за `package-lock.json`.

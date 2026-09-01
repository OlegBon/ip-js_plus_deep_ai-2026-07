# Dependency security update — 2026-09-01

## Выполненное адресное обновление

| Пакет                | Было               | Стало            | Решение                                                       |
| -------------------- | ------------------ | ---------------- | ------------------------------------------------------------- |
| `prisma`             | 7.9.1              | 7.10.0           | Стабильный patch/minor в линии Prisma 7.                      |
| `@prisma/client`     | 7.9.1              | 7.10.0           | Обновлён синхронно с CLI.                                     |
| `@prisma/adapter-pg` | 7.9.1              | 7.10.0           | Обновлён синхронно с Client.                                  |
| `deepmerge-ts`       | 7.1.5 (transitive) | 8.0.0 (override) | Устраняет GHSA-ggr8-5vv4-36mx до upstream-исправления Prisma. |

`package.json` содержит узкий `overrides.deepmerge-ts = "8.0.0"`. Он нужен только
пока `@prisma/config` Prisma 7 фиксирует уязвимую версию. Проверять возможность
удаления override при каждом будущем обновлении Prisma.

## Результат audit

До обновления `npm audit --omit=dev` сообщал 5 finding: 4 high и 1 moderate.
После обновления Prisma и override осталось 2 finding: 1 high и 1 moderate. Оба
относятся к одной цепочке `next-auth@4.24.15 → nodemailer@7.0.13`.

## Отложенное безопасное обновление Auth/email

- `next-auth@4.24.15` — последняя стабильная v4. Доступная v5 является beta, поэтому
  не подходит для production-подготовки без отдельной миграции и стабилизации.
- Для устранения advisories нужен `nodemailer@9.1.0`, но NextAuth v4 объявляет peer
  dependency только `nodemailer ^7.0.7`. Принудительное обновление нарушит
  поддерживаемый контракт; `npm audit fix --force` не применяется.
- Перед production deployment нужно вернуться к этой задаче: проверить стабильный
  релиз Auth.js/NextAuth с peer-поддержкой Nodemailer 9, выполнить отдельную
  миграцию auth-flow и email-flow, затем повторить полный набор тестов и audit.

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
- `npx tsc --noEmit`, `npm run linteslint` и Prettier — успешно.

Локальный `npm run build` не является сигналом регрессии этой зависимости: он
останавливается на недоступности `fonts.googleapis.com`. Production build проходит
в GitHub Actions при обычном сетевом доступе.

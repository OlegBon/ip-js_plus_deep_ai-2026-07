# Render: runbook-план для Paid и Free demo

Это плановый документ. Он не создаёт Render services, не меняет DNS и не добавляет
секреты. На 2 сентября 2026 текущий `docker-compose.production.yml` предназначен
для одного Oracle server и не является `render.yaml`.

## 1. Вывод заранее

Для полноценного публичного MVP реалистичен только **Render Paid**. Вариант
**Render Free + MailHog** можно рассматривать как краткоживущий developer demo,
но не как безопасный production и не как равнозначную замену Oracle:

| Критерий                 | Render Paid                              | Render Free + MailHog                                       |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------------- |
| Next.js                  | always-on web service                    | service засыпает при простое, есть cold start               |
| PostgreSQL               | managed paid database с backup-планом    | free database ограничена и имеет срок жизни                 |
| Gotenberg                | private service в private network        | безопасный private worker недоступен как production-решение |
| Почта                    | реальный SMTP                            | MailHog не доставляет письма пользователям                  |
| Persistent files/backups | external S3 + проверенное восстановление | persistent storage и backup не гарантируются                |
| Допустимое назначение    | production после smoke-tests             | UI/dev preview, не public MVP                               |

Free services также не должны использоваться для обхода ограничений SMTP или для
публичного незащищённого Gotenberg. Перед оформлением всегда сверяйте актуальные
условия и цены с [Render Pricing](https://render.com/pricing) и
[Render Free](https://render.com/docs/free).

---

## 2. Render Paid: целевая схема

```text
Internet
  └─ Render Web Service: Next.js
       ├─ Render Private Service: Gotenberg
       ├─ Managed PostgreSQL
       ├─ External private S3-compatible bucket
       └─ SMTP provider (support@bon.kharkov.ua)
```

- **Web Service:** Docker image приложения; Render передаёт публичный `PORT`,
  поэтому будущая конфигурация должна слушать `0.0.0.0:$PORT` (не фиксированный
  локальный порт `3001`).
- **Gotenberg:** отдельный private service без public route. App обращается к нему
  по internal hostname и порту только внутри private network.
- **PostgreSQL:** managed service в том же регионе. До запуска проверяются
  connection limit/Prisma pool, backups, PITR/restore и стоимость.
- **Storage:** private S3-compatible provider с lifecycle policy. MinIO с named
  volume из Oracle Compose не переносится на Render автоматически; external object
  storage проще масштабировать и резервировать.
- **SMTP:** реальные credentials `support@bon.kharkov.ua`, SPF/DKIM/DMARC и
  TLS-параметры после проверки у uh.ua. MailHog в Paid production не используется.

## 3. Render Paid: отдельная практическая задача

1. Зафиксировать бюджет и регион. Стоимость Render services, database, object
   storage и SMTP проверяется в панели перед созданием, а не берётся из старых
   оценок.
2. Создать managed PostgreSQL, private S3 bucket и backup/restore процедуру.
   Восстановление проверить до приёма пользовательских файлов.
3. Добавить и проверить отдельный `render.yaml` либо конфигурацию в панели:
   web service, private Gotenberg service, health check и без публикации внутренних
   портов. Это меняет deployment-конфигурацию и выполняется в собственной ветке.
4. Добавить secrets через Render dashboard: `DATABASE_URL`, `NEXTAUTH_URL`,
   `NEXTAUTH_SECRET`, SMTP, S3 и `GOTENBERG_URL`. Они различны для preview и
   production и не попадают в репозиторий.
5. Выполнить Prisma migrations контролируемым pre-deploy/one-off шагом после
   backup. Не запускать миграции на каждом старте web service без контроля.
6. Импортировать именно `convertly-hub` как root directory монорепозитория,
   настроить `convertly-hub.bon.kharkov.ua`, HTTPS и DNS у uh.ua.
7. После регистрации подтверждённого пользователя выполнить
   `npm run admin:seed-first` из защищённого one-off окружения.
8. Провести health, auth/email, guest, browser/API conversion, privacy, quota,
   Dashboard/admin smoke-tests и только затем переключать публичный трафик.

## 4. Render Free + MailHog: допустимые границы demo

MailHog полезен локально, но не отправляет письма на реальные адреса. Он не решает
production verification/reset и не должен иметь публичный UI. В Free окружении
полный текущий стек нельзя безопасно повторить без новых специальных решений:

- free Web Service засыпает при отсутствии трафика;
- free PostgreSQL и диски не предоставляют требуемой постоянности для MVP;
- отдельный публичный Gotenberg без защиты создаёт endpoint для злоупотреблений;
- Render Free не следует использовать для обхода ограничений внешнего SMTP;
- один публичный service/port не делает MailHog UI, Next.js и worker безопасно
  доступными одновременно.

Поэтому Free track допустим только после явного решения сделать **неполный demo**:
без реальных пользователей и production-данных, без обещания доставки email,
без реального хранения файлов и с предупреждением о cold start. Если нужен именно
полный функционал конвертации и verification/reset, переходите к Render Paid или
ожидайте доступность Oracle A1.

Не добавляйте MailHog в публичный production service. Для отдельного внутреннего
preview это потребует специального Docker supervision и закрытого доступа к UI;
такая конфигурация не реализуется этим документом и должна иметь собственную
security review и тесты.

## 5. Общие критерии готовности

Перед любым внешним deployment обязателен зелёный GitHub Actions, актуальный
`npm audit --omit=dev`, раздельные secrets, private storage/worker, проверенные
backup/restore, домен/HTTPS и все production smoke-tests. Откат release не заменяет
откат или восстановление данных: для БД и bucket нужен отдельный проверенный план.

## 6. Официальные источники для следующей задачи

- [Render Pricing](https://render.com/pricing)
- [Render Free instances](https://render.com/docs/free)
- [Render private services](https://render.com/docs/private-services)
- [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Render persistent disks](https://render.com/docs/disks)

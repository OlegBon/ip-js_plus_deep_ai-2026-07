# Render: runbook-план для Paid і Free demo

Це плановий документ. Він не створює Render services, не змінює DNS і не додає
секрети. Станом на 2 вересня 2026 поточний `docker-compose.production.yml` призначено
для одного Oracle server і він не є `render.yaml`.

## 1. Висновок наперед

Для повноцінного публічного MVP реалістичний лише **Render Paid**. Варіант
**Render Free + MailHog** можна розглядати як короткоживучий developer demo,
але не як безпечний production і не як рівноцінну заміну Oracle:

| Критерій                 | Render Paid                              | Render Free + MailHog                                       |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------------- |
| Next.js                  | always-on web service                    | service засинає під час простою, є cold start               |
| PostgreSQL               | managed paid database з backup-планом    | free database обмежена та має строк життя                   |
| Gotenberg                | private service у private network        | безпечний private worker недоступний як production-рішення  |
| Пошта                    | реальний SMTP                            | MailHog не доставляє листи користувачам                     |
| Persistent files/backups | external S3 + перевірене відновлення     | persistent storage й backup не гарантуються                 |
| Допустимое назначение    | production после smoke-tests             | UI/dev preview, не public MVP                               |

Free services також не мають використовуватися для обходу обмежень SMTP або для
публічного незахищеного Gotenberg. Перед оформленням завжди звіряйте актуальні
умови й ціни з [Render Pricing](https://render.com/pricing) і
[Render Free](https://render.com/docs/free).

---

## 2. Render Paid: цільова схема

```text
Internet
  └─ Render Web Service: Next.js
       ├─ Render Private Service: Gotenberg
       ├─ Managed PostgreSQL
       ├─ External private S3-compatible bucket
       └─ SMTP provider (support@bon.kharkov.ua)
```

- **Web Service:** Docker image застосунку; Render передає публічний `PORT`,
  тому майбутня конфігурація має слухати `0.0.0.0:$PORT` (не фіксований
  локальний порт `3001`).
- **Gotenberg:** окремий private service без public route. App звертається до нього
  за internal hostname і портом лише всередині private network.
- **PostgreSQL:** managed service в том же регионе. До запуска проверяются
  connection limit/Prisma pool, backups, PITR/restore і вартість.
- **Storage:** private S3-compatible provider з lifecycle policy. MinIO з named
  volume з Oracle Compose не переноситься на Render автоматично; external object
  storage простіше масштабувати та резервувати.
- **SMTP:** реальні credentials `support@bon.kharkov.ua`, SPF/DKIM/DMARC і
  TLS-параметри після перевірки в uh.ua. MailHog у Paid production не використовується.

## 3. Render Paid: окреме практичне завдання

1. Зафіксувати бюджет і регіон. Вартість Render services, database, object
   storage і SMTP перевіряється в панелі перед створенням, а не береться зі старих
   оцінок.
2. Створити managed PostgreSQL, private S3 bucket і backup/restore процедуру.
   Відновлення перевірити до приймання користувацьких файлів.
3. Додати й перевірити окремий `render.yaml` або конфігурацію в панелі:
   web service, private Gotenberg service, health check і без публікації внутрішніх
   портів. Це змінює deployment-конфігурацію й виконується у власній гілці.
4. Додати secrets через Render dashboard: `DATABASE_URL`, `NEXTAUTH_URL`,
   `NEXTAUTH_SECRET`, SMTP, S3 і `GOTENBERG_URL`. Вони різні для preview та
   production і не потрапляють до репозиторію.
5. Виконати Prisma migrations контрольованим pre-deploy/one-off кроком після
   backup. Не запускати міграції на кожному старті web service без контролю.
6. Імпортувати саме `convertly-hub` як root directory монорепозиторію,
   налаштувати `convertly-hub.bon.kharkov.ua`, HTTPS і DNS в uh.ua.
7. Після реєстрації підтвердженого користувача виконати
   `npm run admin:seed-first` із захищеного one-off середовища.
8. Провести health, auth/email, guest, browser/API conversion, privacy, quota,
   Dashboard/admin smoke-tests і лише потім перемикати публічний трафік.

## 4. Render Free + MailHog: допустимі межі demo

MailHog корисний локально, але не надсилає листи на реальні адреси. Він не вирішує
production verification/reset і не має мати публічний UI. У Free середовищі
повний поточний стек не можна безпечно повторити без нових спеціальних рішень:

- free Web Service засинає за відсутності трафіку;
- free PostgreSQL і диски не надають необхідної постійності для MVP;
- окремий публічний Gotenberg без захисту створює endpoint для зловживань;
- Render Free не слід використовувати для обходу обмежень зовнішнього SMTP;
- один публічний service/port не робить MailHog UI, Next.js і worker безпечно
  доступними одночасно.

Тому Free track допустимий лише після явного рішення зробити **неповний demo**:
без реальних користувачів і production-даних, без обіцянки доставки email,
без реального зберігання файлів і з попередженням про cold start. Якщо потрібен саме
повний функціонал конвертації та verification/reset, переходьте до Render Paid або
очікуйте доступність Oracle A1.

Не додавайте MailHog до публічного production service. Для окремого внутрішнього
preview це потребуватиме спеціального Docker supervision і закритого доступу до UI;
така конфігурація не реалізується цим документом і має мати власні
security review і тести.

## 5. Общие критерии готовности

Перед будь-яким зовнішнім deployment обов’язкові зелений GitHub Actions, актуальний
`npm audit --omit=dev`, роздільні secrets, private storage/worker, перевірені
backup/restore, домен/HTTPS і все production smoke-tests. Відкат release не замінює відкат або відновлення даних: для БД і bucket потрібен окремий перевірений план.

## 6. Офіційні джерела для наступного завдання

- [Render Pricing](https://render.com/pricing)
- [Render Free instances](https://render.com/docs/free)
- [Render private services](https://render.com/docs/private-services)
- [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Render persistent disks](https://render.com/docs/disks)

# Web performance audit — DOCX → PDF in Northflank demo

- **UTC:** `2026-09-03T18:19:26.248Z`
- **Environment:** public demo `convertly-hub.bon.kharkov.ua` on Northflank
  Developer Sandbox; PostgreSQL and S3-compatible Storage on Supabase; private
  Gotenberg service.
- **Scope:** reported failure of a 4-page/130 KB DOCX while a one-line/14 KB
  DOCX succeeds.

## Method and limits

- Measured `GET /api/health` externally: HTTP 200, total `0.926 s`.
- The public health response previously reported `database`, `storage` and
  `gotenberg` as `up`.
- Reviewed the DOCX conversion path in `lib/core/conversion.ts` and deployment
  configuration. The application calls private Gotenberg
  `/forms/libreoffice/convert` and aborts the request after 30 seconds.
- After this report was created, the same 4-page/130 KB DOCX completed
  successfully in guest mode. Guest and authenticated conversions share the
  same Core and Gotenberg path, so the input is not deterministically
  unsupported. This is evidence of a transient condition, not a capacity SLA.
- Gotenberg logs then confirmed a LibreOffice cold-start failure: startup did
  not finish within its 20-second start timeout (HTTP 503), followed by a
  client cancellation at 30.08 seconds (HTTP 499). Once warm, the same DOCX
  returned HTTP 200 in 6.47–7.59 seconds.
- The authenticated failure at `18:26 UTC` is independent: Gotenberg returned
  PDF successfully (HTTP 200, 6.58 seconds, 135,221 bytes), but
  `ConversionLog` ended as `FAILED` with `storageKey=NULL`. The failure is
  therefore after conversion, during storage reservation or S3 result upload.

## Evidence update

The guest flow streams the result and bypasses S3. The authenticated flow
converts asynchronously and must persist the result. The browser's repeated
`409` responses are expected polling while the job is pending/processing; its
final `404 Stored conversion not found` is the resulting failed job, not the
primary error.

The next targeted fix is safe server-side stage/S3 error logging for the
conversion job, followed by verification of the Supabase S3 `PutObject` path.
The Gotenberg cold-start limits should be adjusted separately after checking
worker CPU/memory.

## 1. Діагностична матриця

| Рівень архітектури  | Виявлена проблема                                                                                                                                                                                                                  | Зачеплена метрика                    | Критичність |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| Клієнт              | UI отримує лише безпечний загальний failure, без причини Gotenberg; користувач не може відрізнити timeout від unsupported DOCX.                                                                                                  | INP / task completion                | Середня     |
| Мережа              | `app → Gotenberg` використовує private network, тому публічний DNS/TLS не є частиною DOCX path. Мережеву причину поки не підтверджено.                                           | Internal request time                | Низька      |
| Сервер              | `lib/core/conversion.ts` використовує фіксований `AbortSignal.timeout(30_000)`. Будь-яка DOCX-конвертація довша за 30 s припиняється застосунком.                                | Conversion success rate / latency    | Висока      |
| Сервер              | Повторна guest-конвертація того самого DOCX пройшла. Це виключає стабільно непідтримуваний input, але не виключає cold start, resource pressure або timeout.                       | Conversion success rate / latency    | Висока      |
| Сервер              | `convertly-app` було розгорнуто з `0.1 vCPU / 256 MB`; ресурсний план private Gotenberg на момент аудиту не підтверджено. Якщо він також використовує default free compute, LibreOffice може бути OOM-killed або істотно сповільненим. | Memory pressure / restarts / timeout | Висока      |
| БД                  | PostgreSQL і Storage healthy; DOCX conversion не виконує важкої SQL-роботи на критичній ділянці.                                                                                                                                | DB latency                           | Низька      |

## 2. План дій

1. **[Сервер]** Повторіть той самий DOCX один раз в авторизованому режимі та
   зафіксуйте час. Навіщо: виключити регресію quota/storage поверх спільного
   Core path.
2. **[Сервер]** У Northflank відкрийте `convertly-gotenberg` → **Observe** →
   **Logs** і **Resources** одразу після повторного збою. Навіщо: визначити
   фактичний клас помилки — OOM/restart, timeout або LibreOffice document
   failure — до зміни лімітів.
3. **[Сервер]** Зафіксуйте для failed run timestamp, HTTP status в app log,
   Gotenberg log і значення CPU/memory/restarts. Навіщо: відтворювані дані
   дадуть змогу обрати мінімальне виправлення замість збільшення ресурсів навмання.
4. **[Сервер]** Якщо є restart/OOM або sustained memory pressure, збільште
   ресурси _private Gotenberg service_, а не публічного Next.js app, потім
   повторіть тест тим самим DOCX. Навіщо: LibreOffice працює саме у Gotenberg.
5. **[Сервер]** Якщо Gotenberg завершує оброблення після 30 s без OOM, винесіть
   timeout до server-only environment variable з безпечним production default і
   додайте тести для timeout behavior. Навіщо: важкі, але припустимі документи
   не мають перериватися передчасно; нескінченне очікування також неприпустиме.
6. **[Клієнт]** Після встановлення причини додати явний стан оброблення та
   зрозуміле повідомлення про невдалу конвертацію документа; не розкривати raw
   Gotenberg error користувачу. Навіщо: користувач не сприйматиме
   тривале оброблення як зависання та не створюватиме повторно задачі.
7. **[Операції]** Для публічного production не використовувати Developer Sandbox
   як фінальний capacity-майданчик: провести load/smoke набір із кількома
   реальними DOCX до оголошення supportable file limits. Навіщо: поточний demo
   підтверджує інтеграцію, але не capacity SLA.

## Immediate next observation

Повторіть один failed DOCX один раз і надішліть із Northflank лише:

- `convertly-gotenberg` logs вокруг timestamp;
- service restarts и memory/CPU graph;
- app log HTTP status для цієї конвертації.

Не публікуйте S3 credentials, session cookies, API keys, connection strings,
SMTP password або сам приватний документ.

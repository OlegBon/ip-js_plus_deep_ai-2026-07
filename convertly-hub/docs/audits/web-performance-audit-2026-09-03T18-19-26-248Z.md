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
- No failed document, Gotenberg log entry, resource graph or restart event was
  available during this audit. Therefore no browser metric or exact failure
  cause was measured; conclusions below distinguish observed facts from risks.

## 1. Діагностична матриця

| Рівень архітектури  | Виявлена проблема                                                                                                                                                                                                                  | Зачеплена метрика                    | Критичність |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| Клієнт              | UI отримує лише безпечний загальний failure, без причини Gotenberg; користувач не може відрізнити timeout від unsupported DOCX.                                                                                                  | INP / task completion                | Середня     |
| Мережа              | `app → Gotenberg` використовує private network, тому публічний DNS/TLS не є частиною DOCX path. Мережеву причину поки не підтверджено.                                           | Internal request time                | Низька      |
| Сервер              | `lib/core/conversion.ts` використовує фіксований `AbortSignal.timeout(30_000)`. Будь-яка DOCX-конвертація довша за 30 s припиняється застосунком.                                | Conversion success rate / latency    | Висока      |
| Сервер              | LibreOffice/Gotenberg чутливий до вмісту DOCX (зображення, шрифти, таблиці, embedded objects), а не до розміру ZIP-файлу. 130 KB не доводить мале навантаження.                     | Memory / CPU / conversion latency    | Висока      |
| Сервер              | `convertly-app` було розгорнуто з `0.1 vCPU / 256 MB`; ресурсний план private Gotenberg на момент аудиту не підтверджено. Якщо він також використовує default free compute, LibreOffice може бути OOM-killed або істотно сповільненим. | Memory pressure / restarts / timeout | Висока      |
| БД                  | PostgreSQL і Storage healthy; DOCX conversion не виконує важкої SQL-роботи на критичній ділянці.                                                                                                                                | DB latency                           | Низька      |

## 2. План дій

1. **[Сервер]** У Northflank відкрийте `convertly-gotenberg` → **Observe** →
   **Logs** і **Resources** одразу після повторного збою. Навіщо: визначити
   фактичний клас помилки — OOM/restart, timeout або LibreOffice document
   failure — до зміни лімітів.
2. **[Сервер]** Зафіксуйте для failed run timestamp, HTTP status в app log,
   Gotenberg log і значення CPU/memory/restarts. Навіщо: відтворювані дані
   дадуть змогу обрати мінімальне виправлення замість збільшення ресурсів навмання.
3. **[Сервер]** Якщо є restart/OOM або sustained memory pressure, збільште
   ресурси _private Gotenberg service_, а не публічного Next.js app, потім
   повторіть тест тим самим DOCX. Навіщо: LibreOffice працює саме у Gotenberg.
4. **[Сервер]** Якщо Gotenberg завершує оброблення після 30 s без OOM, винесіть
   timeout до server-only environment variable з безпечним production default і
   додайте тести для timeout behavior. Навіщо: важкі, але припустимі документи
   не мають перериватися передчасно; нескінченне очікування також неприпустиме.
5. **[Клієнт]** Після встановлення причини додати явний стан оброблення та
   зрозуміле повідомлення про невдалу конвертацію документа; не розкривати raw
   Gotenberg error користувачу. Навіщо: користувач не сприйматиме
   тривале оброблення як зависання та не створюватиме повторно задачі.
6. **[Операції]** Для публічного production не використовувати Developer Sandbox
   як фінальний capacity-майданчик: провести load/smoke набір із кількома
   реальними DOCX до оголошення supportable file limits. Навіщо: поточний demo
   підтверджує інтеграцію, але не capacity SLA.

## Immediate next observation

Повторіть один failed DOCX один раз і надішліть із Northflank лише:

- `convertly-gotenberg` logs навколо timestamp;
- service restarts і memory/CPU graph;
- app log HTTP status для цієї конвертації.

Не публікуйте S3 credentials, session cookies, API keys, connection strings,
SMTP password або сам приватний документ.

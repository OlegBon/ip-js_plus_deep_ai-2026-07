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

## 1. Diagnostic Matrix

| Уровень архитектуры | Найденная проблема                                                                                                                                                                                                                | Затронутая метрика                   | Критичность |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| Клиент              | UI получает лишь безопасный общий failure, без причины Gotenberg; пользователь не может отличить timeout от unsupported DOCX.                                                                                                     | INP / task completion                | Средняя     |
| Сеть                | `app → Gotenberg` использует private network, поэтому публичный DNS/TLS не является частью DOCX path. Сетевая причина пока не подтверждена.                                                                                       | Internal request time                | Низкая      |
| Сервер              | `lib/core/conversion.ts` использует фиксированный `AbortSignal.timeout(30_000)`. Любая DOCX-конвертация дольше 30 s прекращается приложением.                                                                                     | Conversion success rate / latency    | Высокая     |
| Сервер              | Повторная guest-конвертация того же DOCX прошла. Это исключает стабильно неподдерживаемый input, но не исключает cold start, resource pressure или timeout.                                                                       | Conversion success rate / latency    | Высокая     |
| Сервер              | `convertly-app` был развёрнут с `0.1 vCPU / 256 MB`; ресурсный план private Gotenberg на момент аудита не подтверждён. Если он также использует default free compute, LibreOffice может быть OOM-killed или существенно замедлен. | Memory pressure / restarts / timeout | Высокая     |
| БД                  | PostgreSQL и Storage healthy; DOCX conversion не выполняет тяжёлую SQL-работу на критическом участке.                                                                                                                             | DB latency                           | Низкая      |

## 2. Action Plan

1. **[Сервер]** Повторите тот же DOCX один раз в авторизованном режиме и
   зафиксируйте время. Зачем: исключить регрессию quota/storage поверх общего
   Core path.
2. **[Сервер]** В Northflank откройте `convertly-gotenberg` → **Observe** →
   **Logs** и **Resources** сразу после повторного сбоя. Зачем: определить
   фактический класс ошибки — OOM/restart, timeout или LibreOffice document
   failure — до изменения лимитов.
3. **[Сервер]** Зафиксируйте для failed run timestamp, HTTP status в app log,
   Gotenberg log и значения CPU/memory/restarts. Зачем: воспроизводимые данные
   позволят выбрать минимальное исправление вместо увеличения ресурсов вслепую.
4. **[Сервер]** Если есть restart/OOM или sustained memory pressure, увеличьте
   ресурсы _private Gotenberg service_, а не публичного Next.js app, затем
   повторите тест тем же DOCX. Зачем: LibreOffice работает именно в Gotenberg.
5. **[Сервер]** Если Gotenberg завершает обработку после 30 s без OOM, вынесите
   timeout в server-only environment variable с безопасным production default и
   добавьте тесты для timeout behavior. Зачем: тяжёлые, но допустимые документы
   не должны прерываться преждевременно; бесконечное ожидание также недопустимо.
6. **[Клиент]** После установления причины добавить явное состояние обработки и
   понятное сообщение о неуспешной документ-конвертации; не раскрывать raw
   Gotenberg error пользователю. Зачем: пользователь не будет воспринимать
   долгую обработку как зависание и не будет повторно создавать задания.
7. **[Операции]** Для публичного production не использовать Developer Sandbox
   как финальную capacity-площадку: провести load/smoke набор с несколькими
   реальными DOCX до объявления supportable file limits. Зачем: текущий demo
   подтверждает интеграцию, но не capacity SLA.

## Immediate next observation

Повторите один failed DOCX один раз и пришлите из Northflank только:

- `convertly-gotenberg` logs вокруг timestamp;
- service restarts и memory/CPU graph;
- app log HTTP status для этой конвертации.

Не публикуйте S3 credentials, session cookies, API keys, connection strings,
SMTP password или сам приватный документ.

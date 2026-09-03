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

## 1. Diagnostic Matrix

| Уровень архитектуры | Найденная проблема                                                                                                                                                                                                                | Затронутая метрика                   | Критичность |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| Клиент              | UI получает лишь безопасный общий failure, без причины Gotenberg; пользователь не может отличить timeout от unsupported DOCX.                                                                                                     | INP / task completion                | Средняя     |
| Сеть                | `app → Gotenberg` использует private network, поэтому публичный DNS/TLS не является частью DOCX path. Сетевая причина пока не подтверждена.                                                                                       | Internal request time                | Низкая      |
| Сервер              | `lib/core/conversion.ts` использует фиксированный `AbortSignal.timeout(30_000)`. Любая DOCX-конвертация дольше 30 s прекращается приложением.                                                                                     | Conversion success rate / latency    | Высокая     |
| Сервер              | LibreOffice/Gotenberg чувствителен к содержимому DOCX (изображения, шрифты, таблицы, embedded objects), а не к размеру ZIP-файла. 130 KB не доказывает малую нагрузку.                                                            | Memory / CPU / conversion latency    | Высокая     |
| Сервер              | `convertly-app` был развёрнут с `0.1 vCPU / 256 MB`; ресурсный план private Gotenberg на момент аудита не подтверждён. Если он также использует default free compute, LibreOffice может быть OOM-killed или существенно замедлен. | Memory pressure / restarts / timeout | Высокая     |
| БД                  | PostgreSQL и Storage healthy; DOCX conversion не выполняет тяжёлую SQL-работу на критическом участке.                                                                                                                             | DB latency                           | Низкая      |

## 2. Action Plan

1. **[Сервер]** В Northflank откройте `convertly-gotenberg` → **Observe** →
   **Logs** и **Resources** сразу после повторного сбоя. Зачем: определить
   фактический класс ошибки — OOM/restart, timeout или LibreOffice document
   failure — до изменения лимитов.
2. **[Сервер]** Зафиксируйте для failed run timestamp, HTTP status в app log,
   Gotenberg log и значения CPU/memory/restarts. Зачем: воспроизводимые данные
   позволят выбрать минимальное исправление вместо увеличения ресурсов вслепую.
3. **[Сервер]** Если есть restart/OOM или sustained memory pressure, увеличьте
   ресурсы _private Gotenberg service_, а не публичного Next.js app, затем
   повторите тест тем же DOCX. Зачем: LibreOffice работает именно в Gotenberg.
4. **[Сервер]** Если Gotenberg завершает обработку после 30 s без OOM, вынесите
   timeout в server-only environment variable с безопасным production default и
   добавьте тесты для timeout behavior. Зачем: тяжёлые, но допустимые документы
   не должны прерываться преждевременно; бесконечное ожидание также недопустимо.
5. **[Клиент]** После установления причины добавить явное состояние обработки и
   понятное сообщение о неуспешной документ-конвертации; не раскрывать raw
   Gotenberg error пользователю. Зачем: пользователь не будет воспринимать
   долгую обработку как зависание и не будет повторно создавать задания.
6. **[Операции]** Для публичного production не использовать Developer Sandbox
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

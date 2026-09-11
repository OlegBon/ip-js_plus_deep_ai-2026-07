# Web performance audit — Northflank + Supabase MVP

- **UTC:** `2026-09-11T12:51:44.076Z`
- **Environment:** public demo `https://convertly-hub.bon.kharkov.ua`; Northflank public Next.js app, private Gotenberg, Supabase PostgreSQL and S3-compatible Storage.
- **Scope:** public home page, `/api/health`, response caching and code-level client/server/database review.

## Method and limits

- Three external HTTP measurements per endpoint.
- `/`: HTTP 200; TTFB `267–323 ms`, total `267–323 ms`.
- `/api/health`: HTTP 200; TTFB `305–364 ms`, total `306–364 ms`.
- The home page response has `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `s-maxage=31536000`, content length `13,289 B`; observed upstream service time was `3 ms`.
- `/api/health` is intentionally `no-store`; observed upstream service time was `183 ms` and it confirmed Database, Storage and Gotenberg as `up`.
- Browser field metrics, Lighthouse, mobile CPU throttling and load tests were unavailable; no LCP, INP or CLS values are claimed.

## 1. Діагностична матриця

| Рівень архітектури | Виявлена проблема                                                                                                                                                                                                                             | Зачеплена метрика                 | Критичність                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------- |
| Клієнт             | **Архітектурний ризик:** головна сторінка є client component і до hydration виконує session та guest-quota fetch. Реальні LCP/INP/CLS не виміряні.                                                                                            | Потенційно LCP / INP              | Середня                           |
| Мережа             | Виміряний public TTFB стабільний: `/` `267–323 ms`, `/api/health` `305–364 ms`. Головна сторінка віддається з Next.js cache hit і довгим shared-cache TTL.                                                                                    | TTFB                              | Низька                            |
| Сервер             | `/api/health` на кожен запит перевіряє PostgreSQL, Storage і Gotenberg та має `no-store`. Це правильно для readiness, але не має використовуватися як високочастотний public polling endpoint.                                                | Server load / TTFB                | Середня                           |
| Сервер             | DOCX → PDF використовує fixed `30 s` timeout для private Gotenberg. Це захищає від зависання, але для cold LibreOffice або важких DOCX може знижувати success rate.                                                                           | Conversion latency / success rate | Середня                           |
| БД                 | Поточні account/admin списки використовують bounded pagination і паралельні `findMany`/`count`; основні conversion indexes наявні. **Ризик масштабу:** admin search використовує case-insensitive `contains` за email/name без trigram index. | DB latency / TTFB                 | Низька зараз, середня за масштабу |

## 2. План дій

1. **[Клієнт]** Дія: зняти Lighthouse або RUM-метрики на desktop і mobile для home, login, dashboard і conversion flow. Навіщо: отримати фактичні LCP (< 2.5 s), INP (< 200 ms) і CLS (< 0.1) до оптимізації hydration.
2. **[Сервер]** Дія: обмежити polling `/api/health` або винести deep dependency check до internal/low-frequency probe. Навіщо: readiness залишиться достовірним без зайвого навантаження на Supabase, S3 і Gotenberg.
3. **[Сервер]** Дія: виміряти DOCX cold/warm conversion і CPU/memory private Gotenberg. Навіщо: вирішити на підставі даних, чи потрібні більші ресурси worker або configurable timeout.
4. **[БД]** Дія: коли admin user search стане частим або таблиця суттєво виросте, виконати `EXPLAIN ANALYZE` і за потреби додати `pg_trgm` index. Навіщо: уникнути повільних sequence scans без передчасної оптимізації MVP.
5. **[Мережа]** Дія: зберегти cacheable prerendering home page; після зміни public shell повторити HTTP-вимірювання й browser-аудит. Навіщо: не допустити регресії поточного TTFB нижче 400 ms у контрольному маршруті.

## Висновок

Виміряні public маршрути стабільні й не показують актуального performance incident. Найближчі дії — отримати фактичні Core Web Vitals і перевірити Gotenberg під cold start/документним навантаженням; DB search optimization поки є лише scale-risk.

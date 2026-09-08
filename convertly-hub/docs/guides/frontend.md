# Frontend: страницы, компоненты и пользовательские потоки

## 1. Роль frontend-слоя

Frontend находится в `app/` и `components/`. Это Next.js App Router-приложение:
страницы показывают экран, client components отвечают за интерактивность, а данные
запрашиваются через собственные Route Handlers `/api/**`. Компонент **не** должен
напрямую обращаться к Prisma, MinIO, Gotenberg или секретам.

| Место                   | Что находится внутри                    | Примеры                                              |
| ----------------------- | --------------------------------------- | ---------------------------------------------------- |
| `app/`                  | маршруты, layouts, страницы, API routes | `app/page.tsx`, `app/(dashboard)/dashboard/page.tsx` |
| `components/core/`      | общие части сайта и conversion UI       | `Header.tsx`, `FileDropzone.tsx`                     |
| `components/auth/`      | формы регистрации, входа, пароля        | `LoginForm.tsx`, `PasswordField.tsx`                 |
| `components/dashboard/` | профиль, тарифы, ключи, история         | `ConversionHistory.tsx`, `ApiKeyManager.tsx`         |
| `components/admin/`     | метрики и управление пользователями     | `SystemMonitoring.tsx`, `UserManagement.tsx`         |
| `components/ui/`        | нейтральные переиспользуемые controls   | `Button.tsx`, `Search.tsx`, `CursorPagination.tsx`   |
| `lib/client/`           | browser-only persistence                | `guest-conversion-cache.ts`                          |

## 2. Маршруты и layouts

### Корневой экран

[`app/page.tsx`](../../app/page.tsx) — client page главной. Она получает
NextAuth session через `useSession()` и выбирает один из двух UX:

```tsx
const { status } = useSession();
const isAuthenticated = status === 'authenticated';

const endpoint = isAuthenticated ? '/api/account/conversions' : '/api/guest/conversions';
```

- анониму показывает месячный остаток и временные guest downloads;
- авторизованному — тарифный лимит, который сервер применяет сам;
- состояние `loading` не подменяется догадкой о пользователе: сначала выводится
  `Checking your session…`.

### Route groups

Круглые скобки в именах каталогов — route group, а не часть URL:

```text
app/(auth)/login/page.tsx             → /login
app/(auth)/register/page.tsx          → /register
app/(dashboard)/dashboard/page.tsx    → /dashboard
app/(dashboard)/management/page.tsx   → /management
```

`app/(dashboard)/layout.tsx` задаёт общий каркас личного кабинета. Его страницы
проверяют сессию на серверной стороне, а `management/layout.tsx` дополнительно
требует роль `ADMIN`. Скрытие ссылки в Header — лишь UX; безопасность маршрута
обеспечивает серверная авторизация.

## 3. Главный пример: загрузка и скачивание файла

### 3.1. `FileDropzone` — общий интерактивный control

[`components/core/FileDropzone.tsx`](../../components/core/FileDropzone.tsx)
получает не endpoint, а callback `onUpload(file)`. Благодаря этому один component
работает для image/document и guest/account, не дублируя UI.

Его состояния:

```ts
type Status = 'idle' | 'uploading' | 'success' | 'already-available' | 'error';
```

`uploadInProgress.current` блокирует второй drop во время обработки. После успеха
или найденного ранее результата `SUCCESS_DISPLAY_MS = 5_000` возвращает зону в
`idle`, чтобы следующая загрузка не требовала обновления страницы.

`react-dropzone` даёт раннюю проверку расширения/MIME и `maxSize`, но это только
удобство. Серверная проверка является обязательной и описана в
[backend.md](./backend.md).

### 3.2. `app/page.tsx` — orchestration в браузере

`handleUpload` строит `FormData`, выбирает endpoint и принимает два вида успеха:

```tsx
const response = await fetch(endpoint, { method: 'POST', body: formData });

const resultResponse =
  response.status === 202 ? await waitForStoredResult(await conversionId(response)) : response;
const blob = await resultResponse.blob();
downloadResult(blob, fileName);
```

- `200` — файл уже готов и выдаётся бинарным потоком;
- `202` — сервер сохранил request и запускает background work; клиент polling-ом
  вызывает защищённый account download endpoint. `409` означает «ещё обрабатываем»;
  это не ошибка, поэтому `waitForStoredResult` повторяет запрос до 35 раз;
- JSON `{ status: 'AVAILABLE', conversionId }` означает совпадающий готовый
  результат. Dropzone выводит ссылку **Open Dashboard**, а не повторно тратит квоту.

### 3.3. Особенность гостя

После guest-конвертации скачанный `Blob` сохраняется не на сервере, а через
[`lib/client/guest-conversion-cache.ts`](../../lib/client/guest-conversion-cache.ts).
Главная страница передаёт его в
[`GuestConversionSummary.tsx`](../../components/core/GuestConversionSummary.tsx).
Каждые 30 секунд страница очищает объект, когда закончились 10 минут:

```tsx
if (result.expiresAt <= currentTime) {
  void expireGuestConversionResult(result);
  return { ...result, blob: null };
}
```

Это намеренно не даёт гостю server-side history: cookie-квота контролируется
сервером, а сам результат остаётся только в текущем браузере.

## 4. Dashboard: данные, таблицы и общие controls

[`components/dashboard/ConversionHistory.tsx`](../../components/dashboard/ConversionHistory.tsx)
загружает только собственные данные через `GET /api/account/conversions`.
Состояние фильтра, сортировки и cursor-страниц хранится в `useState`, а URL
параметры собираются перед `fetch`.

```tsx
type SortField = 'sourceFileName' | 'targetFormat' | 'status' | 'expiresAt' | 'createdAt';

function canDownload(conversion: Conversion) {
  return (
    conversion.status === 'COMPLETED' &&
    conversion.storageKey !== null &&
    (conversion.expiresAt === null || new Date(conversion.expiresAt) > new Date())
  );
}
```

Имя результата становится ссылкой только при `canDownload`. Поэтому UI не обещает
доступ к privacy-mode или уже удалённому файлу. `Search` и `CursorPagination` в
`components/ui/` используются также админской таблицей: общий UI не содержит
админских прав и бизнес-правил.

Другие Dashboard modules:

- `UserProfile.tsx` отображает имя, email/Telegram статус и защищённые действия;
  badge `Verified` находится в строке с Telegram username. После Connect/Change
  компонент опрашивает profile endpoint раз в 5 секунд, максимум 2 минуты, и
  сам показывает результат подтверждённой привязки;
- `EditProfileModal.tsx` отправляет изменения профиля и текущий пароль в account
  API, показывает текущий Telegram username и позволяет заменить привязку через
  одноразовый deep link;
- `ApiKeyManager.tsx` показывает API secret один раз после `POST`, затем только
  metadata и revoke;
- `PrivacySettings.tsx` меняет выбор хранения, если это разрешено тарифом;
- `UserPlan.tsx` получает billing overview и открывает mock checkout.

## 5. Auth и формы

`components/auth/PasswordField.tsx` — единый input c show/hide control. Поэтому
E2E-тесты выбирают пароль как textbox, а кнопку — по роли `button` и accessible
name `Show Password`, не неоднозначным `getByLabel('Password')`.

`RegisterForm.tsx`, `LoginForm.tsx` и password-reset pages выполняют проверку для
быстрого feedback, но canonical password policy применяет backend. Email и Telegram
не считаются подтверждёнными, пока server endpoint не обработает одноразовый token.
После Telegram-привязки форма Password Reset принимает `@username`: одноразовая
ссылка на смену пароля приходит только в подтверждённый private chat.

## 6. Интерактивные состояния: единая политика UI

У компонентов нет права считать успешным действие до ответа сервера. Для нового
или изменяемого UI-flow сначала определите все наблюдаемые состояния:

| Состояние       | Что видит пользователь                                                             | Примеры в проекте                                       |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Initial/loading | нейтральный текст или skeleton, без ложной ошибки                                  | `Checking your session…`, загрузка history и profile    |
| Pending         | действие нельзя отправить повторно; кнопка сохраняет понятную цель                 | `FileDropzone` во время upload, модальные подтверждения |
| Success         | точный toast и обновлённые данные, а не только закрытая модалка                    | создание/revoke API key, сохранение profile             |
| Error           | безопасное сообщение без server stack trace; пользователь может повторить действие | route errors в Dashboard и формах                       |
| Empty/disabled  | объяснение причины и следующий допустимый шаг                                      | Free-plan API keys, storage toggle, пустая history      |

`FileDropzone.tsx` — эталон для длительного пользовательского действия: его
`uploadInProgress.current` предотвращает параллельный upload, а visual status
меняется только после результата. Для коротких `fetch`-операций используйте
локальный `isSubmitting`/`isSaving` и передавайте `disabled`, пока promise не
завершится. Не заменяйте это только toast-ом: toast не предотвращает двойной
клик и не сообщает screen reader, что control временно недоступен.

### Polling — только когда сервер меняет данные вне текущего click

Polling здесь не является общим способом обновления Dashboard:

- после Telegram deep link `UserProfile.tsx` обновляет profile каждые 5 секунд,
  не дольше 2 минут, чтобы показать подтверждённую привязку без ручного refresh;
- deletion request проверяется примерно раз в 30 секунд, потому что администратор
  завершает удаление в другом сеансе. Если сервер больше не находит текущего
  пользователя, клиент завершает сессию и переводит его на главную;
- history, тариф и API keys обновляются после своего успешного действия или
  явного refresh, а не постоянным polling.

Перед добавлением нового interval ответьте на три вопроса: какое внешнее событие
мы ждём, когда остановить таймер и что должен увидеть пользователь при ошибке.
Всегда очищайте interval в cleanup `useEffect`; не запускайте второй interval при
повторном render.

## 7. Безопасный порядок frontend-изменения

1. Определите, это экран (`app/`), reusable UI (`components/ui`) или business UI
   (`components/dashboard`, `components/admin`).
2. Добавьте/измените typed contract API, но не дублируйте server validation в UI.
3. Для новой интерактивности пометьте компонент `'use client'` только если нужны
   hooks, browser API или event handler.
4. Проверьте loading, error, empty и disabled states; не скрывайте server failure.
5. Добавьте component test рядом с component; при критическом пользователском
   пути — Playwright scenario.

Связанные проверки: [testing-and-operations.md](./testing-and-operations.md).

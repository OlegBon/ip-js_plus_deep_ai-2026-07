# Frontend: сторінки, компоненти та користувацькі потоки

## 1. Роль frontend-шару

Frontend розміщений у `app/` і `components/`. Це Next.js App Router-застосунок:
сторінки показують екран, client components відповідають за інтерактивність, а дані
запитуються через власні Route Handlers `/api/**`. Компонент **не** має
безпосередньо звертатися до Prisma, MinIO, Gotenberg або секретів.

| Місце                   | Що міститься всередині                   | Приклади                                             |
| ----------------------- | --------------------------------------- | ---------------------------------------------------- |
| `app/`                  | маршрути, layouts, сторінки, API routes | `app/page.tsx`, `app/(dashboard)/dashboard/page.tsx` |
| `components/core/`      | спільні частини сайту та conversion UI  | `Header.tsx`, `FileDropzone.tsx`                     |
| `components/auth/`      | форми реєстрації, входу, пароля         | `LoginForm.tsx`, `PasswordField.tsx`                 |
| `components/dashboard/` | профіль, тарифи, ключі, історія         | `ConversionHistory.tsx`, `ApiKeyManager.tsx`         |
| `components/admin/`     | метрики та керування користувачами      | `SystemMonitoring.tsx`, `UserManagement.tsx`         |
| `components/ui/`        | нейтральні перевикористовувані controls | `Button.tsx`, `Search.tsx`, `CursorPagination.tsx`   |
| `lib/client/`           | browser-only persistence                | `guest-conversion-cache.ts`                          |

## 2. Маршрути та layouts

### Кореневий екран

[`app/page.tsx`](../../app/page.tsx) — client page головної. Вона отримує
NextAuth session через `useSession()` і обирає один із двох UX:

```tsx
const { status } = useSession();
const isAuthenticated = status === 'authenticated';

const endpoint = isAuthenticated ? '/api/account/conversions' : '/api/guest/conversions';
```

- аноніму показує місячний залишок і тимчасові guest downloads;
- авторизованому — тарифний ліміт, який сервер застосовує сам;
- стан `loading` не підміняється здогадом про користувача: спочатку виводиться
  `Checking your session…`.

### Route groups

Круглі дужки в іменах каталогів — route group, а не частина URL:

```text
app/(auth)/login/page.tsx             → /login
app/(auth)/register/page.tsx          → /register
app/(dashboard)/dashboard/page.tsx    → /dashboard
app/(dashboard)/management/page.tsx   → /management
```

`app/(dashboard)/layout.tsx` задає спільний каркас особистого кабінету. Його сторінки
перевіряють сесію на серверній стороні, а `management/layout.tsx` додатково
потребує роль `ADMIN`. Приховування посилання у Header — лише UX; безпеку маршруту
забезпечує серверна авторизація.

## 3. Головний приклад: завантаження та скачування файлу

### 3.1. `FileDropzone` — спільний інтерактивний control

[`components/core/FileDropzone.tsx`](../../components/core/FileDropzone.tsx)
отримує не endpoint, а callback `onUpload(file)`. Завдяки цьому один component
працює для image/document і guest/account, не дублюючи UI.

Його стани:

```ts
type Status = 'idle' | 'uploading' | 'success' | 'already-available' | 'error';
```

`uploadInProgress.current` блокує другий drop під час обробки. Після успіху
або знайденого раніше результату `SUCCESS_DISPLAY_MS = 5_000` повертає зону до
`idle`, щоб наступне завантаження не потребувало оновлення сторінки.

`react-dropzone` надає ранню перевірку розширення/MIME та `maxSize`, але це лише
зручність. Серверна перевірка є обов'язковою й описана в
[backend.md](./backend.md).

### 3.2. `app/page.tsx` — orchestration у браузері

`handleUpload` будує `FormData`, обирає endpoint і приймає два види успіху:

```tsx
const response = await fetch(endpoint, { method: 'POST', body: formData });

const resultResponse =
  response.status === 202 ? await waitForStoredResult(await conversionId(response)) : response;
const blob = await resultResponse.blob();
downloadResult(blob, fileName);
```

- `200` — файл уже готовий і видається бінарним потоком;
- `202` — сервер зберіг request і запускає background work; клієнт polling-ом
  викликає захищений account download endpoint. `409` означає «ще обробляємо»;
  це не помилка, тому `waitForStoredResult` повторює запит до 35 разів;
- JSON `{ status: 'AVAILABLE', conversionId }` означає збіжний готовий
  результат. Dropzone виводить посилання **Open Dashboard**, а не повторно витрачає квоту.

### 3.3. Особливість гостя

Після guest-конвертації скачаний `Blob` зберігається не на сервері, а через
[`lib/client/guest-conversion-cache.ts`](../../lib/client/guest-conversion-cache.ts).
Головна сторінка передає його до
[`GuestConversionSummary.tsx`](../../components/core/GuestConversionSummary.tsx).
Кожні 30 секунд сторінка очищує об'єкт, коли минули 10 хвилин:

```tsx
if (result.expiresAt <= currentTime) {
  void expireGuestConversionResult(result);
  return { ...result, blob: null };
}
```

Це навмисно не надає гостю server-side history: cookie-квота контролюється
сервером, а сам результат лишається лише у поточному браузері.

## 4. Dashboard: дані, таблиці та спільні controls

[`components/dashboard/ConversionHistory.tsx`](../../components/dashboard/ConversionHistory.tsx)
завантажує лише власні дані через `GET /api/account/conversions`.
Стан фільтра, сортування та cursor-сторінок зберігається в `useState`, а URL
параметри збираються перед `fetch`.

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

Назва результату стає посиланням лише за `canDownload`. Тому UI не обіцяє
доступ до privacy-mode або вже видаленого файлу. `Search` і `CursorPagination` у
`components/ui/` також використовує адмінська таблиця: спільний UI не містить
адмінських прав і бізнес-правил.

Інші Dashboard modules:

- `UserProfile.tsx` відображає ім'я, email/Telegram статус і захищені дії;
  badge `Verified` міститься у рядку з Telegram username. Після Connect/Change
  компонент опитує profile endpoint раз на 5 секунд, максимум 2 хвилини, і
  сам показує результат підтвердженої прив'язки. Для підключеного облікового запису
  дії Change/Disconnect використовують одну responsive-групу: на mobile обидві
  кнопки займають рядок без перенесення слів, на `sm` повертаються до природної
  ширини;
- `EditProfileModal.tsx` надсилає зміни профілю та поточний пароль до account
  API, показує поточний Telegram username і дозволяє замінити прив'язку через
  одноразовий deep link. Disconnect відкриває той самий `ConfirmationModal`, що й
  інші destructive-дії, та явно повідомляє, що email recovery зберігається;
- `ApiKeyManager.tsx` показує API secret один раз після `POST`, потім лише
  metadata та revoke;
- `PrivacySettings.tsx` змінює вибір зберігання, якщо це дозволено тарифом;
- `UserPlan.tsx` отримує billing overview і відкриває mock checkout.

## 5. Auth і форми

`components/auth/PasswordField.tsx` — єдиний input із show/hide control. Тому
E2E-тести обирають пароль як textbox, а кнопку — за роллю `button` і accessible
name `Show Password`, а не неоднозначним `getByLabel('Password')`.

`RegisterForm.tsx`, `LoginForm.tsx` і password-reset pages виконують перевірку для
швидкого feedback, але canonical password policy застосовує backend. Email і Telegram
не вважаються підтвердженими, доки server endpoint не обробить одноразовий token.
Після Telegram-прив'язки форма Password Reset приймає `@username`: одноразове
посилання на зміну пароля надходить лише до підтвердженого private chat.

## 6. Інтерактивні стани: єдина політика UI

Компоненти не мають права вважати дію успішною до відповіді сервера. Для нового
або змінюваного UI-flow спочатку визначте всі спостережувані стани:

| Стан            | Що бачить користувач                                                               | Приклади у проєкті                                      |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Initial/loading | нейтральний текст або skeleton, без хибної помилки                                 | `Checking your session…`, завантаження history і profile |
| Pending         | дію не можна надіслати повторно; кнопка зберігає зрозумілу мету                    | `FileDropzone` під час upload, модальні підтвердження    |
| Success         | точний toast і оновлені дані, а не лише закрита модалка                            | створення/revoke API key, збереження profile             |
| Error           | безпечне повідомлення без server stack trace; користувач може повторити дію        | route errors у Dashboard і формах                        |
| Empty/disabled  | пояснення причини й наступний допустимий крок                                      | Free-plan API keys, storage toggle, порожня history      |

`FileDropzone.tsx` — еталон для тривалої користувацької дії: його
`uploadInProgress.current` запобігає паралельному upload, а visual status
змінюється лише після результату. Для коротких `fetch`-операцій використовуйте
локальний `isSubmitting`/`isSaving` і передавайте `disabled`, доки promise не
завершиться. Не замінюйте це лише toast-ом: toast не запобігає подвійному
кліку та не повідомляє screen reader, що control тимчасово недоступний.

Responsive action у картці слідує тому самому правилу: на вузькому екрані опис
іде першим, а одна action-кнопка розміщується нижче на всю доступну ширину без
перенесення слів; з `sm` action повертається праворуч і має natural width. Так
влаштовані `Create key` і `Delete Account` у `ApiKeyManager.tsx` та
`UserProfile.tsx`. Якщо станів два (`Request submitted` і `Cancel request`),
вони лишаються в одному рівному mobile-рядку.

### Polling — лише коли сервер змінює дані поза поточним click

Polling тут не є спільним способом оновлення Dashboard:

- після Telegram deep link `UserProfile.tsx` оновлює profile кожні 5 секунд,
  не довше 2 хвилин, щоб показати підтверджену прив'язку без ручного refresh;
- deletion request перевіряється приблизно раз на 30 секунд, оскільки адміністратор
  завершує видалення в іншому сеансі. Якщо сервер більше не знаходить поточного
  користувача, клієнт завершує сесію та переводить його на головну;
- history, тариф і API keys оновлюються після своєї успішної дії або
  явного refresh, а не постійним polling.

Перед додаванням нового interval дайте відповідь на три питання: яку зовнішню подію
ми чекаємо, коли зупинити таймер і що має побачити користувач у разі помилки.
Завжди очищуйте interval у cleanup `useEffect`; не запускайте другий interval під час
повторного render.

## 7. Безпечний порядок frontend-зміни

1. Визначте, це екран (`app/`), reusable UI (`components/ui`) чи business UI
   (`components/dashboard`, `components/admin`).
2. Додайте/змініть typed contract API, але не дублюйте server validation в UI.
3. Для нової інтерактивності позначте компонент `'use client'` лише якщо потрібні
   hooks, browser API або event handler.
4. Перевірте loading, error, empty і disabled states; не приховуйте server failure.
5. Додайте component test поруч із component; для критичного користувацького
   шляху — Playwright scenario.

Пов'язані перевірки: [testing-and-operations.md](./testing-and-operations.md).

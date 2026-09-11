# Локальні правила: Тестування

> Цей файл містить правила тестування React-застосунків.

## 1. Інструменти

-   **Тест-ранер:** Vitest або Jest.
-   **Тестування компонентів:** **React Testing Library (RTL)** — стандарт проєкту.
-   **E2E-тести:** Playwright.
-   **Мокування API:** MSW (Mock Service Worker).

## 2. Основний принцип

**Тестуй те, що бачить і робить користувач, а не деталі реалізації.**

-   **Ніколи не тестуй:**
    -   внутрішній стан компонента;
    -   пропси, передані дочірнім компонентам;
    -   які хуки було викликано.
-   **Шукай елементи в такому порядку:**
    1.  за роллю, доступною користувачеві (`getByRole`, `getByLabelText`);
    2.  за текстом (`getByText`);
    3.  у крайньому разі — за `data-testid`.

## 3. Взаємодія з користувачем

-   Використовуй **`userEvent`** замість `fireEvent`. `userEvent` імітує реальну поведінку користувача у браузері (кліки, введення тексту з клавіатури), тоді як `fireEvent` просто викликає одну подію.
-   Завжди використовуй `await` під час викликів `userEvent`.

```tsx
import userEvent from "@testing-library/user-event";

test("форма має надсилатися коректно", async () => {
  const user = userEvent.setup();
  render(<MyForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText("Email"), "user@example.com");
  await user.click(screen.getByRole("button", { name: /надіслати/i }));

  expect(handleSubmit).toHaveBeenCalledWith({ email: "user@example.com" });
});
```

## 4. Асинхронні операції

-   Для пошуку елементів, що з'являються асинхронно, використовуй `findBy*` (наприклад, `await screen.findByText("Завантажено")`).
-   Щоб очікувати виконання побічних ефектів (наприклад, виклику функції), використовуй `waitFor`.

## 5. Мокування API

-   Використовуй **MSW (Mock Service Worker)** для всіх тестів, які виконують мережеві запити. Це дає змогу тестувати компонент, хуки та бібліотеку для `fetch` в умовах, наближених до реальних.

## 6. Snapshot-тести

-   **Уникай Snapshot-тестів для компонентів.** Вони крихкі, їх складно рецензувати, і їх часто схвалюють без належної уваги.
-   Використовуй їх лише для чистого виведення даних (наприклад, серіалізації об'єкта в рядок).
-   Для візуальної регресії використовуй скриншот-тести в Playwright.

## 7. Тестування кастомних хуків

-   Використовуй `renderHook` із RTL.
-   Обгортай виклики, що змінюють стан, у `act`.

```tsx
import { renderHook, act } from "@testing-library/react";

test("хук useCounter має інкрементувати значення", () => {
  const { result } = renderHook(() => useCounter());
  act(() => {
    result.current.increment();
  });
  expect(result.current.count).toBe(1);
});
```

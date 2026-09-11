# Дизайн-система: Мінімалістичний SaaS

Цю дизайн-систему розроблено для SaaS-платформи, орієнтованої на простоту, ясність і зручність використання. Надихаючись Vercel і Pirsch Analytics, ми прагнемо створити мінімалістичний інтерфейс, який не відволікає користувача від його основних завдань.

## Design Philosophy (Філософія дизайну)

- **Простота**: Менше — означає більше. Ми уникаємо зайвих елементів і прикрас.
- **Послідовність**: Єдність у компонентах і відступах для інтуїтивно зрозумілого досвіду.
- **Читабельність**: Пріоритет надається чіткій типографіці та контрастності.

## Layout (Макет)

Використовується система відступів, кратна 8px, для візуальної гармонії.

- `space-xs`: `4px`
- `space-sm`: `8px`
- `space-md`: `16px`
- `space-lg`: `24px`
- `space-xl`: `32px`

**Макет**: Основний контейнер має максимальну ширину `1200px` і центрований. Бічна панель (якщо є) — `240px`.

## Tokens (Токени)

Токени — це основа нашої дизайн-системи, представлена у вигляді CSS-змінних. Вони забезпечують послідовність у всьому застосунку.

### Colors (Кольори)
```css
:root {
  --color-background: #FFFFFF;
  --color-background-secondary: #F7F7F7;
  --color-text-primary: #111111;
  --color-text-secondary: #666666;
  --color-accent: #007AFF;
  --color-accent-hover: #0056B3;
  --color-border: #EAEAEA;
}
```

### Typography (Типографіка)
```css
:root {
  --font-family-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
}
```

### Spacing (Відступи)
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

## Surfaces (Поверхні)

Поверхні — це основні «полотна», на яких розміщується контент.

- **Основний фон**: `var(--color-background)`. Використовується для основного тіла сторінки.
- **Вторинний фон**: `var(--color-background-secondary)`. Використовується для бічних панелей, виділених секцій або карток, щоб створити візуальну ієрархію.

## Components (Компоненти)

### Кнопки
Прості й зрозумілі кнопки з чіткими станами.

### Поля введення
Мінімалістичні поля введення з акцентом на рамці у фокусі.

## Imagery (Зображення)

- **Іконки**: Використовуйте SVG-іконки для чіткості на всіх екранах. Рекомендований стиль — `outline` (контурний), товщина `1.5px`.
- **Зображення**: Мають бути оптимізовані для вебу. Використовуйте плейсхолдери під час завантаження.

## Do's and Don'ts (Що робити й чого не робити)

### Do's (Що робити)
- **Використовуйте відступи**: Застосовуйте токени відступів (`--space-sm`, `--space-md` тощо) для створення ритму в макеті.
- **Обмежуйте довжину рядків**: Для текстових блоків використовуйте `max-width: 75ch` для кращої читабельності.
- **Дотримуйтеся палітри**: Використовуйте лише кольори, визначені в токенах.

### Don'ts (Чого не робити)
- **Не створюйте кастомні кольори**: Це порушує послідовність. Якщо потрібен новий колір, додайте його до палітри як токен.
- **Не ускладнюйте**: Уникайте зайвих тіней, градієнтів та інших прикрас.
- **Не ігноруйте стани**: Усі інтерактивні елементи мають мати стани `hover`, `focus` і `disabled`.

## Quick Start (Швидкий старт)

Цей CSS-файл містить усі необхідні токени та базові стилі для компонентів.

```css
/* 1. Токени */
:root {
  /* Цвета */
  --color-background: #FFFFFF;
  --color-background-secondary: #F7F7F7;
  --color-text-primary: #111111;
  --color-text-secondary: #666666;
  --color-accent: #007AFF;
  --color-accent-hover: #0056B3;
  --color-border: #EAEAEA;

  /* Типографика */
  --font-family-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;

  /* Відступи */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}

/* 2. Глобальні стилі */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

/* 3. Компоненти */

/* Кнопки */
.btn {
  display: inline-block;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: var(--font-size-base);
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.btn-primary {
  background-color: var(--color-accent);
  color: #FFFFFF;
}

.btn-primary:hover {
  background-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-background-secondary);
}

/* Поля ввода */
.input {
  display: block;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}
```

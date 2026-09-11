# Design System: Convertly Hub

Цей документ визначає принципи дизайну та компоненти для **Convertly Hub** — сервісу конвертації файлів із наданням публічного API. Система ґрунтується на мінімалізмі й функціональності, з елементами, натхненними Vercel і Pirsch Analytics.

## Design Philosophy (філософія дизайну)

-   **Інформативність**: елементи інтерфейсу мають бути не лише функціональними, а й нести інформацію.
-   **Зворотний зв'язок**: чітка та негайна реакція на дії користувача.
-   **Масштабованість**: компоненти легко адаптуються до різних контекстів і розмірів екрана.

---

## Layout (макет)

Макет адаптивний і використовує контейнер із визначеними точками перемикання (брейкпоінтами) для різних екранів.

-   **Контейнер**: основний вміст обмежено максимальною шириною `1280px`.
-   **Брейкпоінти**:
    -   **Mobile**: `< 768px` (одна колонка, гумова ширина)
    -   **Tablet**: `768px` - `1024px` (адаптивна сітка, гумова ширина)
    -   **Desktop**: `> 1024px` (повноцінна сітка, контейнер із `max-width`)
-   **Відступи між секціями**: `48px` (`var(--space-5)`)
-   **Внутрішні відступи в картках**: `24px` (`var(--space-3)`)

---

## Tokens (токени)

### Colors (кольори)

```css
:root {
  /* Основні */
  --color-background: #FFFFFF;
  --color-background-secondary: #F9FAFB;
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-accent: #4F46E5;
  --color-accent-hover: #4338CA;
  --color-border: #E5E7EB;

  /* Семантичні */
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;

  /* Блоки коду */
  --color-code-bg: #111827;
  --color-code-text: #E5E7EB;
}
```

### Typography (типографіка)

```css
:root {
  --font-family-headings: "Inter", sans-serif;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "Fira Code", monospace;
}
```

### Spacing (відступи)

Усі відступи та розміри в макеті засновано на сітковій системі, кратній **8px**.

```css
:root {
  --space-1: 8px;  /* (xs) */
  --space-2: 16px; /* (sm) */
  --space-3: 24px; /* (md) */
  --space-4: 32px; /* (lg) */
  --space-5: 48px; /* (xl) */
  --space-6: 64px; /* (2xl) */
}
```

---

## Components (компоненти)

### Buttons (кнопки)

Кнопки — основний спосіб взаємодії користувача з інтерфейсом.

-   **Primary Button**: для головного заклику до дії.
    -   *Default*: фон `var(--color-accent)`, текст `white`.
    -   *Hover*: фон `var(--color-accent-hover)`.
    -   *Disabled*: фон `var(--color-border)`, текст `var(--color-text-secondary)`.

-   **Secondary Button**: для другорядних дій.
    -   *Default*: прозорий фон, текст `var(--color-text-primary)`, рамка `1px solid var(--color-border)`.
    -   *Hover*: фон `var(--color-background-secondary)`.
    -   *Disabled*: текст `var(--color-text-secondary)`, рамка `1px solid var(--color-border)`.

### Input Fields (поля введення)
Використовуються у формах для введення даних.
- **Label:** текст над полем, `var(--color-text-primary)`.
- **Default:** рамка `1px solid var(--color-border)`, фон `var(--color-background)`.
- **Focus:** рамка `1px solid var(--color-accent)`.
- **Error:** рамка `1px solid var(--color-error)`. Під полем виводиться текст помилки (`var(--color-error)`).

### Toggle Switch (перемикач)
Для бінарних налаштувань, наприклад «Зберігати результати конвертації».
- **Off State:** фон `var(--color-border)`.
- **On State:** фон `var(--color-accent)`.
- **Handle:** біле коло, що переміщується.

### Tables (таблиці)
Для відображення історії конвертацій і параметрів API.
- **Header:** жирний текст (`font-weight: 500`), фон `var(--color-background-secondary)`.
- **Row:** нижня рамка `1px solid var(--color-border)`.
- **Hover:** рядок підсвічується фоном `var(--color-background-secondary)`.

### Code Blocks (блоки коду)
Для документації API. Темна тема обов'язкова.
- **Background:** `var(--color-code-bg)`.
- **Text:** `var(--color-code-text)`.
- **Syntax Highlighting:** для токенів використовуються акцентні кольори.

### Alerts / Toasts (сповіщення)
Для негайного зворотного зв'язку.
- **Alert:** статичне сповіщення.
- **Toast:** спливне сповіщення.
- **Success:** зелений фон/рамка (`var(--color-success)`).
- **Error:** червоний фон/рамка (`var(--color-error)`).

### Progress Bar (індикатор прогресу)
Показує хід виконання тривалої операції.
- **Track:** фон `var(--color-border)`.
- **Indicator:** смуга заповнення з фоном `var(--color-accent)`.

### Sidebar (бічна навігація)
Основна навігація в особистому кабінеті.
- **Background:** `var(--color-background-secondary)` або `var(--color-background)`.
- **Links:** текст `var(--color-text-secondary)`.
- **Active Link:** жирний текст `var(--color-text-primary)`.

### Картки (Cards)
Картки використовуються для групування вмісту. Мають фон `var(--color-background-secondary)`, легку тінь і заокруглені кути (`8px`).

---

## Surfaces (поверхні)

-   **Картки (Cards)**: використовують `var(--color-background-secondary)` з легкою тінню та заокругленими кутами (`8px`) для візуального відділення від основного фону.
-   **Модальні вікна (Modals)**: мають оверлей, що затемнює основний вміст, і використовують фон `var(--color-background)` із виразнішою тінню.

---

## Imagery (зображення)

-   **Іконографія**: стандартизований набір іконок [Heroicons](https://heroicons.com/) (20px, `outline`). Колір іконок має відповідати контексту: `--color-text-secondary` для нейтральних і `--color-accent` для інтерактивних.
-   **Ілюстрації**: можна використовувати для онбордингу або порожніх станів. Стиль має бути простим, векторним і відповідати палітрі кольорів.

---

## Do's and Don'ts (що робити та чого не робити)

### Do's (що робити)
-   **Використовуй семантичні кольори**: застосовуй `--color-success`, `--color-error`, `--color-warning` для зворотного зв'язку користувачеві.
-   **Використовуй шкалу відступів**: усі `margin` і `padding` мають бути кратними `8px`.
-   **Групуй вміст у картки**: це допомагає структурувати інформацію на складних сторінках.

### Don'ts (чого не робити)
-   **Не використовуй «магічні» числа**: уникай довільних піксельних значень для розмірів і відступів.
-   **Не змішуй стилі кнопок**: не використовуй основний і вторинний стилі для однієї мети.
-   **Не перевантажуй картки**: картка має містити пов'язану інформацію.

---

## Anti-Patterns (AI Slop Guardrails) / Антипатерни (настанови для запобігання AI-слопу)

Наведені нижче «AI-згенеровані» шаблони суворо заборонені. Дизайн має лишатися функціональним, цілеспрямованим і чистим:

-   **ЖОДНИХ** надмірних градієнтів на всьому (уникай стандартних фіолетово-синіх градієнтів).
-   **ЖОДНИХ** «скляних» карток (glass morphism), розмитих фонових плям або сяйливих сфер без мети.
-   **ЖОДНИХ** градієнтних рамок або масивних кольорових тіней на картках/кнопках.
-   **ЖОДНИХ** заокруглених кутів на елементах, що потребують чіткої структурної ієрархії.
-   **ЖОДНИХ** загальних герой-секцій із центрованим текстом поверх стокових градієнтів.
-   **ЖОДНИХ** лінивих триколонкових сіток зі збільшеними центрованими іконками.
-   **ЖОДНИХ** надмірних анімацій під час прокручування (взаємодія має бути негайною).
-   **ЖОДНИХ** AI-термінів у текстових плейсхолдерах ("Unleash", "Elevate", "Seamless").
-   **ЖОДНИХ** стандартних шрифтів без індивідуальності (наприклад, Sans-serif stack без унікального стилю).

---

## Quick Start (швидкий старт)

```css
/* 1. Токени */
:root {
  /* Кольори */
  --color-background: #FFFFFF;
  --color-background-secondary: #F9FAFB;
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-accent: #4F46E5;
  --color-accent-hover: #4338CA;
  --color-border: #E5E7EB;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-code-bg: #111827;
  --color-code-text: #E5E7EB;
  
  /* Типографіка */
  --font-family-headings: "Inter", sans-serif;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "Fira Code", monospace;

  /* Відступи */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 48px;
  --space-6: 64px;
}

/* 2. Глобальні стилі */
h1, h2, h3 {
  font-family: var(--font-family-headings);
}

pre, code {
  font-family: var(--font-family-mono);
}

/* 3. Компоненти */

/* Кнопки */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-3);
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary {
  background-color: var(--color-accent);
  color: white;
  border: 1px solid var(--color-accent);
}
.btn-primary:hover {
  background-color: var(--color-accent-hover);
}
.btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover {
  background-color: var(--color-background-secondary);
}

/* Поля введення */
.input {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
.input:focus {
  outline: none;
  border-color: var(--color-accent);
}

/* Блоки коду */
pre {
  background-color: var(--color-code-bg);
  color: var(--color-code-text);
  padding: var(--space-3);
  border-radius: 8px;
  overflow-x: auto;
}

/* Картки */
.card {
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  padding: var(--space-3);
}

/* Сповіщення */
.alert {
  padding: var(--space-2);
  border-radius: 6px;
}
.alert-error {
  background-color: #FEF2F2;
  color: #991B1B;
}
```

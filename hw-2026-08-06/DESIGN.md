# Design System: Convertly Hub

Цей документ визначає принципи дизайну та компоненти для **Convertly Hub** — сервісу конвертації файлів із наданням публічного API. Система заснована на мінімалізмі та функціональності, з елементами, натхненними Vercel і Pirsch Analytics.

## Design Philosophy (Філософія дизайну)

-   **Інформативність**: Елементи інтерфейсу мають бути не лише функціональними, а й нести інформацію.
-   **Зворотний зв’язок**: Чітка й негайна реакція на дії користувача.
-   **Масштабованість**: Компоненти легко адаптуються до різних контекстів і розмірів екрана.

---

## Layout (Макет)

Макет є адаптивним і використовує контейнер із визначеними точками перемикання (брейкпойнтами) для різних екранів.

-   **Контейнер**: Основний контент обмежено максимальною шириною `1280px`.
-   **Брейкпойнти**:
    -   **Mobile**: `< 768px` (одна колонка, гумова ширина)
    -   **Tablet**: `768px` - `1024px` (адаптивна сітка, гумова ширина)
    -   **Desktop**: `> 1024px` (повноцінна сітка, контейнер із `max-width`)
-   **Відступи між секціями**: `48px` (`var(--space-5)`)
-   **Внутрішні відступи в картках**: `24px` (`var(--space-3)`)

---

## Tokens (Токени)

### Colors (Кольори)

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

  /* Семантические */
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;

  /* Блоки кода */
  --color-code-bg: #111827;
  --color-code-text: #E5E7EB;
}
```

### Typography (Типографіка)

```css
:root {
  --font-family-headings: "Inter", sans-serif;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "Fira Code", monospace;
}
```

### Spacing (Відступи)

Усі відступи й розміри в макеті засновано на сітковій системі, кратній **8px**.

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

## Components (Компоненти)

### Buttons (Кнопки)

Кнопки — основний спосіб взаємодії користувача з інтерфейсом.

-   **Primary Button**: Для головного заклику до дії.
    -   *Default*: Фон `var(--color-accent)`, текст `white`.
    -   *Hover*: Фон `var(--color-accent-hover)`.
    -   *Disabled*: Фон `var(--color-border)`, текст `var(--color-text-secondary)`.

-   **Secondary Button**: Для другорядних дій.
    -   *Default*: Прозорий фон, текст `var(--color-text-primary)`, рамка `1px solid var(--color-border)`.
    -   *Hover*: Фон `var(--color-background-secondary)`.
    -   *Disabled*: Текст `var(--color-text-secondary)`, рамка `1px solid var(--color-border)`.

### Input Fields (Поля введення)
Використовуються у формах для введення даних.
- **Label:** Текст над полем, `var(--color-text-primary)`.
- **Default:** Рамка `1px solid var(--color-border)`, фон `var(--color-background)`.
- **Focus:** Рамка `1px solid var(--color-accent)`.
- **Error:** Рамка `1px solid var(--color-error)`. Під полем виводиться текст помилки (`var(--color-error)`).

### Toggle Switch (Перемикач)
Для бінарних налаштувань, наприклад «Зберігати результати конвертації».
- **Off State:** Фон `var(--color-border)`.
- **On State:** Фон `var(--color-accent)`.
- **Handle:** Біле коло, яке переміщується.

### Tables (Таблиці)
Для відображення історії конвертацій і параметрів API.
- **Header:** Жирний текст (`font-weight: 500`), фон `var(--color-background-secondary)`.
- **Row:** Нижня рамка `1px solid var(--color-border)`.
- **Hover:** Рядок підсвічується фоном `var(--color-background-secondary)`.

### Code Blocks (Блоки коду)
Для документації API. Обов’язкова темна тема.
- **Background:** `var(--color-code-bg)`.
- **Text:** `var(--color-code-text)`.
- **Syntax Highlighting:** Використовуються акцентні кольори для токенів.

### Alerts / Toasts (Сповіщення)
Для негайного зворотного зв’язку.
- **Alert:** Статичне сповіщення.
- **Toast:** Спливне сповіщення.
- **Success:** Зелений фон/рамка (`var(--color-success)`).
- **Error:** Червоний фон/рамка (`var(--color-error)`).

### Progress Bar (Індикатор прогресу)
Показує хід виконання тривалої операції.
- **Track:** Фон `var(--color-border)`.
- **Indicator:** Смуга заповнення з фоном `var(--color-accent)`.

### Sidebar (Бічна навігація)
Основна навігація в особистому кабінеті.
- **Background:** `var(--color-background-secondary)` або `var(--color-background)`.
- **Links:** Текст `var(--color-text-secondary)`.
- **Active Link:** Жирний текст `var(--color-text-primary)`.

### Картки (Cards)
Картки використовуються для групування контенту. Мають фон `var(--color-background-secondary)`, легку тінь і заокруглені кути (`8px`).

---

## Surfaces (Поверхні)

-   **Картки (Cards)**: Використовують `var(--color-background-secondary)` із легкою тінню та заокругленими кутами (`8px`) для візуального відокремлення від основного фону.
-   **Модальні вікна (Modals)**: Мають оверлей, що затемнює основний контент, і використовують фон `var(--color-background)` із виразнішою тінню.

---

## Imagery (Зображення)

-   **Іконографія**: Стандартизований набір іконок [Heroicons](https://heroicons.com/) (20px, `outline`). Колір іконок має відповідати контексту: `--color-text-secondary` для нейтральних і `--color-accent` для інтерактивних.
-   **Ілюстрації**: Можна використовувати для онбордингу або порожніх станів. Стиль має бути простим, векторним і відповідати кольоровій палітрі.

---

## Do's and Don'ts (Що робити й чого не робити)

### Do's (Що робити)
-   **Використовуйте семантичні кольори**: Застосовуйте `--color-success`, `--color-error`, `--color-warning` для зворотного зв’язку з користувачем.
-   **Використовуйте шкалу відступів**: Усі `margin` і `padding` мають бути кратними `8px`.
-   **Групуйте контент у картки**: Це допомагає структурувати інформацію на складних сторінках.

### Don'ts (Чого не робити)
-   **Не використовуйте «магічні» числа**: Уникайте довільних піксельних значень для розмірів і відступів.
-   **Не змішуйте стилі кнопок**: Не використовуйте основний і вторинний стилі для однієї й тієї самої мети.
-   **Не перевантажуйте картки**: Картка має містити пов’язану інформацію.

---

## Anti-Patterns (AI Slop Guardrails) / Антипатерни (Настанови щодо запобігання AI-слопу)

Наведені нижче «згенеровані AI» шаблони суворо заборонені. Дизайн має залишатися функціональним, цілеспрямованим і чистим:

-   **ЖОДНИХ** надмірних градієнтів усюди (уникайте стандартних фіолетово-синіх градієнтів).
-   **ЖОДНИХ** «скляних» карток (glass morphism), розмитих фонових плям або сяйливих сфер без мети.
-   **ЖОДНИХ** градієнтних рамок або масивних кольорових тіней на картках/кнопках.
-   **ЖОДНИХ** заокруглених кутів на елементах, що потребують чіткої структурної ієрархії.
-   **ЖОДНИХ** типових hero-секцій із центрованим текстом поверх стокових градієнтів.
-   **ЖОДНИХ** лінивих триколонкових сіток зі збільшеними центрованими іконками.
-   **ЖОДНИХ** надмірних анімацій під час прокручування (взаємодія має бути негайною).
-   **ЖОДНИХ** AI-термінів у текстових плейсхолдерах («Unleash», «Elevate», «Seamless»).
-   **ЖОДНИХ** стандартних шрифтів без індивідуальності (наприклад, Sans-serif stack без унікального стилю).

---

## Quick Start (Швидкий старт)

```css
/* 1. Токени */
:root {
  /* Цвета */
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
  
  /* Типографика */
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

/* Поля вводу */
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

/* Блоки кода */
pre {
  background-color: var(--color-code-bg);
  color: var(--color-code-text);
  padding: var(--space-3);
  border-radius: 8px;
  overflow-x: auto;
}

/* Карточки */
.card {
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  padding: var(--space-3);
}

/* Уведомления */
.alert {
  padding: var(--space-2);
  border-radius: 6px;
}
.alert-error {
  background-color: #FEF2F2;
  color: #991B1B;
}
```

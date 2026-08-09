# Design System: Convertly Hub

Этот документ определяет принципы дизайна и компоненты для **Convertly Hub** — сервиса для конвертации файлов с предоставлением публичного API. Система основана на минимализме и функциональности, с элементами, вдохновленными Vercel и Pirsch Analytics.

## Design Philosophy (Философия дизайна)

-   **Информативность**: Элементы интерфейса должны не только быть функциональными, но и нести информацию.
-   **Обратная связь**: Четкая и немедленная реакция на действия пользователя.
-   **Масштабируемость**: Компоненты легко адаптируются под разные контексты и размеры экрана.

---

## Layout (Макет)

Макет является адаптивным и использует контейнер с определенными точками переключения (брейкпоинтами) для разных экранов.

-   **Контейнер**: Основной контент ограничен максимальной шириной `1280px`.
-   **Брейкпоинты**:
    -   **Mobile**: `< 768px` (одна колонка, резиновая ширина)
    -   **Tablet**: `768px` - `1024px` (адаптивная сетка, резиновая ширина)
    -   **Desktop**: `> 1024px` (полноценная сетка, контейнер с `max-width`)
-   **Отступы между секциями**: `48px` (`var(--space-5)`)
-   **Внутренние отступы в карточках**: `24px` (`var(--space-3)`)

---

## Tokens (Токены)

### Colors (Цвета)

```css
:root {
  /* Основные */
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

### Typography (Типографика)

```css
:root {
  --font-family-headings: "Inter", sans-serif;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "Fira Code", monospace;
}
```

### Spacing (Отступы)

Все отступы и размеры в макете основаны на сеточной системе, кратной **8px**.

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

## Components (Компоненты)

### Buttons (Кнопки)

Кнопки — основной способ взаимодействия пользователя с интерфейсом.

-   **Primary Button**: Для главного призыва к действию.
    -   *Default*: Фон `var(--color-accent)`, текст `white`.
    -   *Hover*: Фон `var(--color-accent-hover)`.
    -   *Disabled*: Фон `var(--color-border)`, текст `var(--color-text-secondary)`.

-   **Secondary Button**: Для второстепенных действий.
    -   *Default*: Прозрачный фон, текст `var(--color-text-primary)`, рамка `1px solid var(--color-border)`.
    -   *Hover*: Фон `var(--color-background-secondary)`.
    -   *Disabled*: Текст `var(--color-text-secondary)`, рамка `1px solid var(--color-border)`.

### Input Fields (Поля вводу)
Используются в формах для ввода данных.
- **Label:** Текст над полем, `var(--color-text-primary)`.
- **Default:** Рамка `1px solid var(--color-border)`, фон `var(--color-background)`.
- **Focus:** Рамка `1px solid var(--color-accent)`.
- **Error:** Рамка `1px solid var(--color-error)`. Под полем выводится текст ошибки (`var(--color-error)`).

### Toggle Switch (Переключатель)
Для бинарных настроек, например, "Сохранять результаты конвертации".
- **Off State:** Фон `var(--color-border)`.
- **On State:** Фон `var(--color-accent)`.
- **Handle:** Белый круг, который перемещается.

### Tables (Таблицы)
Для отображения истории конвертаций и параметров API.
- **Header:** Жирный текст (`font-weight: 500`), фон `var(--color-background-secondary)`.
- **Row:** Нижняя рамка `1px solid var(--color-border)`.
- **Hover:** Строка подсвечивается фоном `var(--color-background-secondary)`.

### Code Blocks (Блоки кода)
Для документации API. Обязательна темная тема.
- **Background:** `var(--color-code-bg)`.
- **Text:** `var(--color-code-text)`.
- **Syntax Highlighting:** Используются акцентные цвета для токенов.

### Alerts / Toasts (Сповіщення)
Для немедленной обратной связи.
- **Alert:** Статичное уведомление.
- **Toast:** Всплывающее уведомление.
- **Success:** Зеленый фон/рамка (`var(--color-success)`).
- **Error:** Красный фон/рамка (`var(--color-error)`).

### Progress Bar (Индикатор прогресса)
Показывает ход выполнения длительной операции.
- **Track:** Фон `var(--color-border)`.
- **Indicator:** Заполняющая полоса с фоном `var(--color-accent)`.

### Sidebar (Боковая навигация)
Основная навигация в личном кабинете.
- **Background:** `var(--color-background-secondary)` или `var(--color-background)`.
- **Links:** Текст `var(--color-text-secondary)`.
- **Active Link:** Жирный текст `var(--color-text-primary)`.

### Карточки (Cards)
Карточки используются для группировки контента. Имеют фон `var(--color-background-secondary)`, легкую тень и скругленные углы (`8px`).

---

## Surfaces (Поверхности)

-   **Карточки (Cards)**: Используют `var(--color-background-secondary)` с легкой тенью и скругленными углами (`8px`) для визуального отделения от основного фона.
-   **Модальные окна (Modals)**: Имеют оверлей, затемняющий основной контент, и используют фон `var(--color-background)` с более выраженной тенью.

---

## Imagery (Изображения)

-   **Иконография**: Стандартизированный набор иконок [Heroicons](https://heroicons.com/) (20px, `outline`). Цвет иконок должен соответствовать контексту: `--color-text-secondary` для нейтральных и `--color-accent` для интерактивных.
-   **Иллюстрации**: Можно использовать для онбординга или пустых состояний. Стиль должен быть простым, векторным, и соответствовать цветовой палитре.

---

## Do's and Don'ts (Что делать и чего не делать)

### Do's (Что делать)
-   **Используйте семантические цвета**: Применяйте `--color-success`, `--color-error`, `--color-warning` для обратной связи пользователю.
-   **Используйте шкалу отступов**: Все `margin` и `padding` должны быть кратны `8px`.
-   **Группируйте контент в карточки**: Это помогает структурировать информацию на сложных страницах.

### Don'ts (Чего не делать)
-   **Не используйте "магические" числа**: Избегайте произвольных пиксельных значений для размеров и отступов.
-   **Не смешивайте стили кнопок**: Не используйте основной и вторичный стили для одной и той же цели.
-   **Не перегружайте карточки**: Карточка должна содержать связанную информацию.

---

## Anti-Patterns (AI Slop Guardrails) / Анти-паттерны (Руководство по предотвращению AI-слопа)

Следующие "AI-сгенерированные" шаблоны строго запрещены. Дизайн должен оставаться функциональным, целенаправленным и чистым:

-   **НИКАКИХ** чрезмерных градиентов на всём (избегайте стандартных фиолетово-синих градиентов).
-   **НИКАКИХ** "стеклянных" карточек (glass morphism), размытых фоновых пятен или светящихся сфер без цели.
-   **НИКАКИХ** градиентных рамок или массивных цветных теней на карточках/кнопках.
-   **НИКАКИХ** скругленных углов на элементах, требующих четкой структурной иерархии.
-   **НИКАКИХ** общих герой-секций с центрированным текстом поверх стоковых градиентов.
-   **НИКАКИХ** ленивых трехколоночных сеток с увеличенными центрированными иконками.
-   **НИКАКИХ** чрезмерных анимаций при прокрутке (взаимодействие должно быть немедленным).
-   **НИКАКИХ** AI-терминов в текстовых плейсхолдерах ("Unleash", "Elevate", "Seamless").
-   **НИКАКИХ** стандартных шрифтов без индивидуальности (например, Sans-serif stack без уникального стиля).

---

## Quick Start (Быстрый старт)

```css
/* 1. Токены */
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

  /* Отступы */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 48px;
  --space-6: 64px;
}

/* 2. Глобальные стили */
h1, h2, h3 {
  font-family: var(--font-family-headings);
}

pre, code {
  font-family: var(--font-family-mono);
}

/* 3. Компоненты */

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

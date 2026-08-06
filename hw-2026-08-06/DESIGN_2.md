# Дизайн-система: Улучшенный SaaS

Этот документ развивает минималистичную дизайн-систему, добавляя больше визуальных акцентов и сложных компонентов, вдохновляясь практиками Vercel и Pirsch Analytics.

## Design Philosophy (Философия дизайна)

- **Информативность**: Элементы интерфейса должны не только быть функциональными, но и нести информацию.
- **Обратная связь**: Четкая и немедленная реакция на действия пользователя.
- **Масштабируемость**: Компоненты легко адаптируются под разные контексты и размеры экрана.

## Layout (Макет)

Сохраняется модульная сетка 8px. Вводятся дополнительные правила для сложных макетов.

- **Отступы между секциями**: `var(--space-xl)` или `48px`.
- **Внутренние отступы в карточках**: `var(--space-lg)`.

## Tokens (Токены)

Токены расширены для поддержки большего разнообразия UI-элементов.

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

## Surfaces (Поверхности)

Вводятся более сложные поверхности с тенями для создания эффекта глубины.

- **Карточки (Cards)**: Используют `var(--color-background-secondary)` с легкой тенью и скругленными углами (`8px`) для визуального отделения от основного фона.
- **Модальные окна (Modals)**: Имеют оверлей, затемняющий основной контент, и используют фон `var(--color-background)` с более выраженной тенью.

## Components (Компоненты)

### Карточки (Cards)
Карточки используются для группировки контента.

### Уведомления (Alerts)
Используются для отображения семантических сообщений.

## Imagery (Изображения)

- **Иконография**: Стандартизированный набор иконок [Heroicons](https://heroicons.com/) (20px, `outline`). Цвет иконок должен соответствовать контексту: `--color-text-secondary` для нейтральных и `--color-accent` для интерактивных.
- **Иллюстрации**: Можно использовать для онбординга или пустых состояний. Стиль должен быть простым, векторным, и соответствовать цветовой палитре.

## Do's and Don'ts (Что делать и чего не делать)

### Do's (Что делать)
- **Используйте семантические цвета**: Применяйте `--color-success`, `--color-error`, `--color-warning` для обратной связи пользователю.
- **Группируйте контент в карточки**: Это помогает структурировать информацию на сложных страницах.
- **Акцентируйте заголовки**: Используйте шрифт `Inter` для заголовков, чтобы создать визуальную иерархию.

### Don'ts (Чего не делать)
- **Не смешивайте стили кнопок**: Не используйте основной и вторичный стили для одной и той же цели.
- **Не перегружайте карточки**: Карточка должна содержать связанную информацию. Избегайте "свалки" разнородных данных.
- **Не используйте тени и рамки одновременно**: Выберите что-то одно для выделения элемента.

## Quick Start (Быстрый старт)

```css
/* 1. Токены (наследуются из DESIGN_1, здесь только дополнения) */
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
  
  /* Типографика */
  --font-family-headings: "Inter", sans-serif;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "Fira Code", monospace;
}

/* 2. Глобальные стили */
h1, h2, h3 {
  font-family: var(--font-family-headings);
}

code {
  font-family: var(--font-family-mono);
}

/* 3. Компоненты */

/* Карточки */
.card {
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  padding: var(--space-lg);
}

/* Уведомления */
.alert {
  padding: var(--space-md);
  border-radius: 6px;
}

.alert-success {
  background-color: #ECFDF5;
  color: #065F46;
}

.alert-error {
  background-color: #FEF2F2;
  color: #991B1B;
}

.alert-warning {
  background-color: #FFFBEB;
  color: #92400E;
}
```

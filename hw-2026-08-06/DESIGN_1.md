# Дизайн-система: Минималистичный SaaS

Эта дизайн-система разработана для SaaS-платформы, ориентированной на простоту, ясность и удобство использования. Вдохновляясь Vercel и Pirsch Analytics, мы стремимся к минималистичному интерфейсу, который не отвлекает пользователя от его основных задач.

## Design Philosophy (Философия дизайна)

- **Простота**: Меньше — значит больше. Мы избегаем лишних элементов и украшательств.
- **Консистентность**: Единообразие в компонентах и отступах для интуитивного опыта.
- **Читаемость**: Приоритет отдается четкой типографике и контрастности.

## Layout (Макет)

Используется система отступов, кратная 8px, для визуальной гармонии.

- `space-xs`: `4px`
- `space-sm`: `8px`
- `space-md`: `16px`
- `space-lg`: `24px`
- `space-xl`: `32px`

**Макет**: Основной контейнер имеет максимальную ширину `1200px` и центрирован. Боковая панель (если есть) — `240px`.

## Tokens (Токены)

Токены — это основа нашей дизайн-системы, представленная в виде CSS-переменных. Они обеспечивают консистентность во всем приложении.

### Colors (Цвета)
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

### Typography (Типографика)
```css
:root {
  --font-family-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
}
```

### Spacing (Отступы)
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

## Surfaces (Поверхности)

Поверхности — это основные "холсты", на которых размещается контент.

- **Основной фон**: `var(--color-background)`. Используется для основного тела страницы.
- **Вторичный фон**: `var(--color-background-secondary)`. Используется для боковых панелей, выделенных секций или карточек, чтобы создать визуальную иерархию.

## Components (Компоненты)

### Кнопки
Простые и понятные кнопки с четкими состояниями.

### Поля ввода
Минималистичные поля ввода с акцентом на рамке при фокусе.

## Imagery (Изображения)

- **Иконки**: Используйте SVG-иконки для четкости на всех экранах. Рекомендуемый стиль — `outline` (контурный), толщина `1.5px`.
- **Изображения**: Должны быть оптимизированы для веба. Используйте плейсхолдеры во время загрузки.

## Do's and Don'ts (Что делать и чего не делать)

### Do's (Что делать)
- **Используйте отступы**: Применяйте токены отступов (`--space-sm`, `--space-md` и т.д.) для создания ритма в макете.
- **Ограничивайте длину строк**: Для текстовых блоков используйте `max-width: 75ch` для лучшей читаемости.
- **Придерживайтесь палитры**: Используйте только цвета, определенные в токенах.

### Don'ts (Чего не делать)
- **Не создавайте кастомные цвета**: Это нарушает консистентность. Если нужен новый цвет, добавьте его в палитру как токен.
- **Не усложняйте**: Избегайте лишних теней, градиентов и других украшательств.
- **Не игнорируйте состояния**: Все интерактивные элементы должны иметь состояния `hover`, `focus` и `disabled`.

## Quick Start (Быстрый старт)

Этот CSS-файл содержит все необходимые токены и базовые стили для компонентов.

```css
/* 1. Токены */
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

  /* Отступы */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}

/* 2. Глобальные стили */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

/* 3. Компоненты */

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

# Дизайн-система: Покращений SaaS

Цей документ розвиває мінімалістичну дизайн-систему, додаючи більше візуальних акцентів і складних компонентів, натхненних практиками Vercel і Pirsch Analytics.

## Design Philosophy (Філософія дизайну)

- **Інформативність**: Елементи інтерфейсу мають бути не лише функціональними, а й нести інформацію.
- **Зворотний зв’язок**: Чітка й негайна реакція на дії користувача.
- **Масштабованість**: Компоненти легко адаптуються до різних контекстів і розмірів екрана.

## Layout (Макет)

Зберігається модульна сітка 8px. Додаються додаткові правила для складних макетів.

- **Відступи між секціями**: `var(--space-xl)` або `48px`.
- **Внутрішні відступи в картках**: `var(--space-lg)`.

## Tokens (Токени)

Токени розширено для підтримки більшого різноманіття UI-елементів.

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

## Surfaces (Поверхні)

Додаються складніші поверхні з тінями для створення ефекту глибини.

- **Картки (Cards)**: Використовують `var(--color-background-secondary)` із легкою тінню та заокругленими кутами (`8px`) для візуального відокремлення від основного фону.
- **Модальні вікна (Modals)**: Мають оверлей, що затемнює основний контент, і використовують фон `var(--color-background)` із виразнішою тінню.

## Components (Компоненти)

### Картки (Cards)
Картки використовуються для групування контенту.

### Сповіщення (Alerts)
Використовуються для відображення семантичних повідомлень.

## Imagery (Зображення)

- **Іконографія**: Стандартизований набір іконок [Heroicons](https://heroicons.com/) (20px, `outline`). Колір іконок має відповідати контексту: `--color-text-secondary` для нейтральних і `--color-accent` для інтерактивних.
- **Ілюстрації**: Можна використовувати для онбордингу або порожніх станів. Стиль має бути простим, векторним і відповідати кольоровій палітрі.

## Do's and Don'ts (Що робити й чого не робити)

### Do's (Що робити)
- **Використовуйте семантичні кольори**: Застосовуйте `--color-success`, `--color-error`, `--color-warning` для зворотного зв’язку з користувачем.
- **Групуйте контент у картки**: Це допомагає структурувати інформацію на складних сторінках.
- **Акцентуйте заголовки**: Використовуйте шрифт `Inter` для заголовків, щоб створити візуальну ієрархію.

### Don'ts (Чого не робити)
- **Не змішуйте стилі кнопок**: Не використовуйте основний і вторинний стилі для однієї й тієї самої мети.
- **Не перевантажуйте картки**: Картка має містити пов’язану інформацію. Уникайте «звалища» різнорідних даних.
- **Не використовуйте тіні й рамки одночасно**: Виберіть щось одне для виділення елемента.

## Quick Start (Швидкий старт)

```css
/* 1. Токени (успадковуються з DESIGN_1, тут лише доповнення) */
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
  
  /* Типографика */
  --font-family-headings: "Inter", sans-serif;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "Fira Code", monospace;
}

/* 2. Глобальні стилі */
h1, h2, h3 {
  font-family: var(--font-family-headings);
}

code {
  font-family: var(--font-family-mono);
}

/* 3. Компоненти */

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

# Локальні правила: безпека (DevSecOps)

> Цей файл розширює загальні правила безпеки, додаючи аспекти, специфічні для React/Next.js.

## 1. XSS через `dangerouslySetInnerHTML`

**КРИТИЧНО.** Кожне використання цього пропса має розглядатися як серйозний ризик.

```tsx
// КРИТИЧНА ВРАЗЛИВІСТЬ: несанітизоване введення користувача
<div dangerouslySetInnerHTML={{ __html: userBio }} />

// ПРАВИЛЬНІ ВАРІАНТИ:
// 1. Відрендерити як текст (безпечно за замовчуванням)
<div>{userBio}</div>

// 2. Якщо потрібен HTML, спочатку санітизувати за допомогою DOMPurify
import DOMPurify from "isomorphic-dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userBio) }} />
```

## 2. Небезпечні URL-схеми

Посилання `javascript:` і `data:` в атрибутах `href` або `src` можуть виконати довільний код.

```tsx
// ВРАЗЛИВІСТЬ: <a href="javascript:alert(1)">...</a>
<a href={user.website}>Відвідати</a>

// ПРАВИЛЬНО: валідувати протокол
function safeUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return url;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
<a href={safeUrl(user.website)}>Відвідати</a>
```

## 3. `target="_blank"` без `rel`

Посилання `<a target="_blank">` без `rel="noopener noreferrer"` дозволяє новій сторінці отримати доступ до `window.opener`, що небезпечно.

```tsx
// НЕПРАВИЛЬНО
<a href={externalUrl} target="_blank">Зовнішній сайт</a>

// ПРАВИЛЬНО
<a href={externalUrl} target="_blank" rel="noopener noreferrer">Зовнішній сайт</a>
```

## 4. Валідація в Server Actions

Server Actions (`"use server"`) — це повноцінні API-ендпоїнти. Валідуй усі вхідні дані так само, як у звичайному API.

```tsx
"use server";
import { z } from "zod";

const Input = z.object({ email: z.string().email() });

export async function updateUser(formData: FormData) {
  const parsed = Input.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Некоректний email" };
  }
  // ... логіка оновлення ...
}
```

- **Завжди перевіряй авторизацію** всередині Server Action.

## 5. Розкриття секретів через змінні середовища

Змінні середовища, що починаються з `NEXT_PUBLIC_`, вбудовуються в клієнтський бандл і доступні всім.

- **`NEXT_PUBLIC_*`:** для публічних ключів (наприклад, Google Analytics ID).
- **Без префікса:** для секретних ключів, які використовуються лише на сервері (`process.env.STRIPE_SECRET_KEY`).

**Ніколи не використовуй `NEXT_PUBLIC_` для секретів!**

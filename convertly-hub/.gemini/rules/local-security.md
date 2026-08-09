# Локальные правила: Безопасность (DevSecOps)

> Этот файл расширяет общие правила безопасности, добавляя специфичные для React/Next.js аспекты.

## 1. XSS через `dangerouslySetInnerHTML`

**КРИТИЧНО.** Каждое использование этого пропа должно рассматриваться как серьезный риск.

```tsx
// КРИТИЧЕСКАЯ УЯЗВИМОСТЬ: несанитизированный ввод пользователя
<div dangerouslySetInnerHTML={{ __html: userBio }} />

// ПРАВИЛЬНЫЕ ВАРИАНТЫ:
// 1. Отрисовать как текст (безопасно по умолчанию)
<div>{userBio}</div>

// 2. Если нужен HTML, сначала санитизировать с помощью DOMPurify
import DOMPurify from "isomorphic-dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userBio) }} />
```

## 2. Небезопасные URL-схемы

Ссылки `javascript:` и `data:` в атрибутах `href` или `src` могут выполнить произвольный код.

```tsx
// УЯЗВИМОСТЬ: <a href="javascript:alert(1)">...</a>
<a href={user.website}>Посетить</a>

// ПРАВИЛЬНО: валидировать протокол
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
<a href={safeUrl(user.website)}>Посетить</a>
```

## 3. `target="_blank"` без `rel`

Ссылка `<a target="_blank">` без `rel="noopener noreferrer"` позволяет новой странице получить доступ к `window.opener`, что небезопасно.

```tsx
// НЕПРАВИЛЬНО
<a href={externalUrl} target="_blank">Внешний сайт</a>

// ПРАВИЛЬНО
<a href={externalUrl} target="_blank" rel="noopener noreferrer">Внешний сайт</a>
```

## 4. Валидация в Server Actions

Server Actions (`"use server"`) — это полноценные API-эндпоинты. Валидируй все входные данные так же, как в обычном API.

```tsx
"use server";
import { z } from "zod";

const Input = z.object({ email: z.string().email() });

export async function updateUser(formData: FormData) {
  const parsed = Input.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Неверный email" };
  }
  // ... логика обновления ...
}
```

- **Всегда проверяй авторизацию** внутри Server Action.

## 5. Раскрытие секретов через переменные окружения

Переменные окружения, начинающиеся с `NEXT_PUBLIC_`, встраиваются в клиентский бандл и доступны всем.

- **`NEXT_PUBLIC_*`:** для публичных ключей (например, Google Analytics ID).
- **Без префикса:** для секретных ключей, которые используются только на сервере (`process.env.STRIPE_SECRET_KEY`).

**Никогда не используй `NEXT_PUBLIC_` для секретов!**

# Схема базы данных

В этом документе описывается структура базы данных проекта, управляемая с помощью Prisma ORM.

---

## Модели данных

### `User`

Модель для хранения информации о пользователях.

| Поле      | Тип      | Описание                                    | Атрибуты             |
|:----------|:---------|:--------------------------------------------|:---------------------|
| `id`      | `String` | Уникальный идентификатор пользователя (UUID)  | `@id @default(uuid())` |
| `email`     | `String` | Электронная почта пользователя              | `@unique`            |
| `password`  | `String` | Хеш пароля пользователя                     |                      |
| `createdAt` | `DateTime` | Дата и время создания пользователя          | `@default(now())`    |
| `updatedAt` | `DateTime` | Дата и время последнего обновления         | `@updatedAt`         |
| `conversions`| `ConversionLog[]` | Связь с логами конвертаций | |

### `ConversionLog`

Модель для логирования операций конвертации файлов.

| Поле      | Тип      | Описание                                  | Атрибуты                 |
|:----------|:---------|:------------------------------------------|:-------------------------|
| `id`      | `String` | Уникальный идентификатор записи (UUID)    | `@id @default(uuid())`   |
| `fileName`| `String` | Имя исходного файла                       |                          |
| `status`  | `String` | Текущий статус конвертации (`pending` и т.д.) | `@default("pending")`    |
| `createdAt` | `DateTime` | Дата и время создания записи              | `@default(now())`        |
| `userId`  | `String` | Внешний ключ для связи с `User`           |                          |
| `user`    | `User`   | Связанный пользователь                    | `@relation(...)`         |

---

## Схема в формате Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  conversions ConversionLog[]
}

model ConversionLog {
  id        String   @id @default(uuid())
  fileName  String
  status    String   @default("pending")
  createdAt DateTime @default(now())

  // Связь с пользователем
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```

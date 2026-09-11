# Gemini 3.1 Pro через https://gemini.google.com/

## Prompt

Давай розглянемо різні патерни розв'язання такої задачі. Наприклад, чи можна було застосувати патерн Adapter (Адаптер) для її розв'язання? Які ще патерни можливі та який краще використати? Інтегруй патерн, що найкраще підходить у поточне рішення.

## Рішення

Чудове архітектурне мислення. Коли ми писали першу версію, наш `calculator.js` «знав», що у першому джерелі є поле `transactions` зі статусами, а друге джерело — це масив рядків.

У реальному проєкті це пряме порушення **Single Responsibility Principle (Принципу єдиної відповідальності)**. Якщо завтра з'явиться Джерело №3 у форматі XML, нам доведеться переписувати та ускладнювати калькулятор.

Давай розберемо, які патерни тут застосовні:

### 1. Які патерни можна використати?

- **Стратегія (Strategy):** Можна було б створити стратегії парсингу `ParseStrategy1` і `ParseStrategy2` та передавати їх парсеру. Це добре підходить, коли маємо один тип даних, але різні алгоритми оброблення; для нормалізації структури це надмірно.
- **Фабрика (Factory):** Створити `TransactionFactory`, яка приймає сирі дані та повертає стандартизовані об'єкти `Transaction`. Хороший варіант, але фабрика зазвичай застосовується для створення об'єктів із поведінкою (методами), а тут маємо лише структури даних (DTO).
- **Адаптер (Adapter):** **Це абсолютний переможець для цієї задачі.** Суть адаптера — взяти несумісний інтерфейс (у нашому випадку — структуру даних чужого API) і перетворити його на формат, якого очікує наша система.

### 2. Застосовуємо патерн Адаптер

Винесемо всю рутинну роботу (перевірку полів, розбиття рядків, фільтрацію статусу `paid`) до окремого шару адаптерів.
Наша бізнес-логіка (калькулятор) тепер прийматиме лише **єдиний стандартний масив** вигляду `[{ amount: 100, currency: 'USD' }, ...]`.

Ось який тепер вигляд матиме структура твого Vite-проєкту:

#### Новий файл: `src/adapters.js`

Цей модуль бере на себе всю роботу з приведення різних API до єдиного стандарту.

```javascript
/**
 * Адаптер для джерела 1.
 * Очікує об’єкт із масивом transactions.
 * Повертає стандартизований масив транзакцій (лише оплачених).
 */
export function adaptSource1(data) {
  if (!data || !Array.isArray(data.transactions)) return [];

  return (
    data.transactions
      // Бизнес-правило: берем только paid
      .filter((t) => t.type === "paid" && typeof t.amount === "number")
      .map((t) => ({
        amount: t.amount,
        currency: t.currency.toUpperCase(), // сразу нормализуем регистр
      }))
  );
}

/**
 * Адаптер для Источника 2
 * Очікує масив рядків на кшталт "300 usd".
 * Повертає стандартизований масив транзакцій.
 */
export function adaptSource2(data) {
  if (!Array.isArray(data)) return [];

  return (
    data
      .map((item) => {
        if (typeof item !== "string") return null;

        const [amountStr, currency] = item.trim().split(" ");
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || !currency) return null;

        return {
          amount,
          currency: currency.toUpperCase(),
        };
      })
      // filter(Boolean) видаляє всі null із масиву, залишаючи лише валідні об’єкти
      .filter(Boolean)
  );
}
```

#### Оновлений файл: `src/calculator.js`

Подивися, наскільки чистим став калькулятор. Тепер він займається виключно математикою. Йому байдуже, звідки надійшли дані.

```javascript
/**
 * Конвертирует любую валюту в целевую
 */
function convertToTarget(amount, currency, rates, targetCurrency = "USD") {
  if (currency === targetCurrency) return amount;

  const rate = rates[currency];

  if (!rate) {
    console.warn(`Курс для ${currency} не найден. Сумма проигнорирована.`);
    return 0;
  }

  return amount / rate;
}

/**
 * Розраховує загальну виручку з масиву стандартизованих транзакцій.
 * @param {Array} transactions - масив формату [{ amount: 100, currency: 'USD' }].
 * @param {Object} rates - курси валют.
 */
export function calculateTotalRevenue(transactions, rates) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { total: 0, currency: "USD" };
  }

  const targetCurrency = "USD";

  const total = transactions.reduce((sum, transaction) => {
    return (
      sum +
      convertToTarget(
        transaction.amount,
        transaction.currency,
        rates,
        targetCurrency,
      )
    );
  }, 0);

  return {
    total: Number(total.toFixed(2)),
    currency: targetCurrency,
  };
}
```

#### Оновлений файл: `src/main.js`

Точка входу тепер працює як конвеєр: запитали → адаптували → об'єднали → порахували.

```javascript
import "./style.css";

import { API_URLS, API_HEADERS } from "./config.js";
import { fetchData, getExchangeRates } from "./api.js";
import { adaptSource1, adaptSource2 } from "./adapters.js";
import { calculateTotalRevenue } from "./calculator.js";

async function init() {
  console.log("Завантаження даних...");

  const [rawData1, rawData2, rates] = await Promise.all([
    fetchData(API_URLS.source1, API_HEADERS),
    fetchData(API_URLS.source2, API_HEADERS),
    getExchangeRates(),
  ]);

  // 1. Пропускаємо дані через адаптери
  const standardTransactions1 = adaptSource1(rawData1);
  const standardTransactions2 = adaptSource2(rawData2);

  // 2. Об’єднуємо в один плаский масив
  // Spread-оператор (...) розгортає обидва масиви в один спільний
  const allTransactions = [...standardTransactions1, ...standardTransactions2];

  // 3. Считаем итог
  const result = calculateTotalRevenue(allTransactions, rates);

  console.log("Підсумкова виручка:", result);

  // Можна вивести результат прямо на сторінку (якщо в index.html є <div id="app"></div>)
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Підсумкова виручка за день:</h2>
          <h1 style="color: green;">${result.total} ${result.currency}</h1>
        </div>
      `;
  }
}

// Запускаем приложение
init();
```

### В чем профит такого подхода?

 1. **Масштабованість.** Завтра бос скаже: «Ми купили ще одну компанію, у них дані у форматі XML». Ти просто пишеш `adaptSource3`, додаєш його до масиву `allTransactions` і **не змінюєш жодного рядка** в калькуляторі.
2. **Тестируемость.** Тестировать `adaptSource1` отдельно от математики курсов валют намного проще.

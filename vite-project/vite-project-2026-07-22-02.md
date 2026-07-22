# Gemini 3.1 Pro через https://gemini.google.com/

## Prompt

Давай рассмотрим разные паттерны решения такой задачи. Например, можно ли было применить паттерн Adapter (Адаптер) для решения этой задачи? Какие ещё паттерны возможны и какой больше лучше использовать. Интегрируй паттерн, который наиболее подходит в текущее решение.

## Решение

Отличное архитектурное мышление. Когда мы писали первую версию, наш `calculator.js` "знал" о том, что в первом источнике есть поле `transactions` со статусами, а второй источник — это массив строк.

В реальном проекте это прямое нарушение **Single Responsibility Principle (Принципа единственной ответственности)**. Если завтра появится Источник №3 в формате XML, нам придется переписывать и усложнять калькулятор.

Давай разберем, какие паттерны тут применимы:

### 1. Какие паттерны можно использовать?

- **Стратегия (Strategy):** Можно было бы создать стратегии парсинга `ParseStrategy1` и `ParseStrategy2` и скармливать их парсеру. Хорошо подходит, когда у нас один тип данных, но разные алгоритмы обработки, но для нормализации структуры это избыточно.
- **Фабрика (Factory):** Создать `TransactionFactory`, которая принимает сырые данные и возвращает стандартизированные объекты `Transaction`. Хороший вариант, но фабрика обычно применяется для создания объектов с поведением (методами), а у нас тут просто структуры данных (DTO).
- **Адаптер (Adapter):** **Это абсолютный победитель для данной задачи.** Суть адаптера — взять несовместимый интерфейс (в нашем случае — структуру данных от чужого API) и преобразовать его в тот формат, который ожидает наша система.

### 2. Применяем паттерн Адаптер

Мы вынесем всю грязь (проверку полей, разбиение строк, фильтрацию статуса `paid`) в отдельный слой адаптеров.
Наша бизнес-логика (калькулятор) теперь будет принимать только **единый стандартный массив** вида `[{ amount: 100, currency: 'USD' }, ...]`.

Вот как теперь будет выглядеть структура твоего Vite-проекта:

#### Новый файл: `src/adapters.js`

Этот модуль берет на себя всю работу по приведению разных API к единому стандарту.

```javascript
/**
 * Адаптер для Источника 1
 * Ожидает: объект с массивом transactions.
 * Возвращает: стандартизированный массив транзакций (только оплаченные).
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
 * Ожидает: массив строк вида "300 usd".
 * Возвращает: стандартизированный массив транзакций.
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
      // filter(Boolean) удаляет все null из массива, оставляя только валидные объекты
      .filter(Boolean)
  );
}
```

#### Обновленный файл: `src/calculator.js`

Посмотри, насколько чистым стал калькулятор. Теперь он занимается исключительно математикой. Ему вообще плевать, откуда пришли данные.

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
 * Рассчитывает общую выручку из массива стандартизированных транзакций
 * @param {Array} transactions - массив формата [{ amount: 100, currency: 'USD' }]
 * @param {Object} rates - курсы валют
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

#### Обновленный файл: `src/main.js`

Точка входа теперь работает как конвейер: запросили -> адаптировали -> объединили -> посчитали.

```javascript
import "./style.css";

import { API_URLS, API_HEADERS } from "./config.js";
import { fetchData, getExchangeRates } from "./api.js";
import { adaptSource1, adaptSource2 } from "./adapters.js";
import { calculateTotalRevenue } from "./calculator.js";

async function init() {
  console.log("Загрузка данных...");

  const [rawData1, rawData2, rates] = await Promise.all([
    fetchData(API_URLS.source1, API_HEADERS),
    fetchData(API_URLS.source2, API_HEADERS),
    getExchangeRates(),
  ]);

  // 1. Пропускаем данные через адаптеры
  const standardTransactions1 = adaptSource1(rawData1);
  const standardTransactions2 = adaptSource2(rawData2);

  // 2. Объединяем в один плоский массив
  // Spread-оператор (...) разворачивает оба массива в один общий
  const allTransactions = [...standardTransactions1, ...standardTransactions2];

  // 3. Считаем итог
  const result = calculateTotalRevenue(allTransactions, rates);

  console.log("Итоговая выручка:", result);

  // Можно вывести результат прямо на страницу (если в index.html есть <div id="app"></div>)
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Итоговая выручка за день:</h2>
          <h1 style="color: green;">${result.total} ${result.currency}</h1>
        </div>
      `;
  }
}

// Запускаем приложение
init();
```

### В чем профит такого подхода?

1. **Масштабируемость.** Завтра босс скажет: "Мы купили еще одну компанию, у них данные в формате XML". Ты просто пишешь `adaptSource3`, добавляешь его в массив `allTransactions`, и **ни строчки** не меняешь в калькуляторе.
2. **Тестируемость.** Тестировать `adaptSource1` отдельно от математики курсов валют намного проще.

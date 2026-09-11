# Gemini 3.1 Pro через https://gemini.google.com/

## Prompt

Продовжуємо в тій самій гілці, що й попередня домашня робота.

Дані для розрахунків потрібно взяти за адресами із зазначенням заголовка x-api-key та значенням prodcpakey333. Джерело 1 розташоване за адресою https://cpa-server-vtel.onrender.com/api/finance1, а джерело 2 — тут https://cpa-server-vtel.onrender.com/api/finance2.
Напиши універсальну функцію запитів, де значення заголовків зберігатимуться у змінних поза функцією, можливо в окремому файлі / модулі, а чутлива інформація — у `.env` (наприклад, prodcpakey333).
Інтегруй це у рішення та розбий код на модулі.
Переношу логіку до `vite-project`, розгорнутого через `npm create vite@latest`. У `src` видалив папку `assets` і файл `counter.js`. Файл `.env` у корені `vite-project`, а `main.js` — у `src`. У `src` додаємо код, розбитий на модулі.
І ще момент. Тепер дані не в одній валюті: валюти можуть бути різні, і суми у різних валютах не мають змішуватися. Потрібно порахувати реальну загальну суму з різних джерел. Для цього інші валюти треба перетворити на цільову, наприклад USD, у якій виводиться підсумок. Для перетворення потрібно взяти реальні дані щодо курсу валют, наприклад з https://currencyfreaks.com/ або іншого безплатного сервісу. Приклад того, як зараз надходять дані:
{transactions: Array(8), address: {…}}
address
: 
city
: 
"New York"
houseNumber
: 
10
street
: 
"5th Avenue"
[[Prototype]]
: 
Object
transactions
: 
Array(8)
0
: 
{type: 'paid', amount: 100, currency: 'USD'}
1
: 
{type: 'pending', amount: 50, currency: 'USD'}
2
: 
{type: 'paid', amount: 880, currency: 'USD'}
3
: 
{type: 'paid', amount: 130, currency: 'USD'}
4
: 
{type: 'rejected', amount: 560, currency: 'USD'}
5
: 
{type: 'paid', amount: 230, currency: 'EUR'}
6
: 
{type: 'paid', amount: 530, currency: 'EUR'}
7
: 
{type: 'rejected', amount: 430, currency: 'EUR'}
length
: 
8
[[Prototype]]
: 
Array(0)
[[Prototype]]
: 
Object

и

(9) ['300 usd', '200 eur', '150 usd', '200 usd', '450 eur', '400 usd', '670 usd', '190 usd', '500 eur']
0
: 
"300 usd"
1
: 
"200 eur"
2
: 
"150 usd"
3
: 
"200 usd"
4
: 
"450 eur"
5
: 
"400 usd"
6
: 
"670 usd"
7
: 
"190 usd"
8
: 
"500 eur"
length
: 
9
[[Prototype]]
: 
Array(0)

## Рішення

Чудова задача для переходу до реальної архітектури frontend-застосунку. Коли ми працюємо з Vite, розбиваємо логіку за файлами та ховаємо ключі, код стає модульним і безпечним.

У Vite є важливе правило: **усі змінні оточення, які мають бути доступні у браузері (на клієнті), повинні починатися з префікса `VITE_`**. Доступ до них ми отримуємо через `import.meta.env`.

Для отримання реальних курсів валют я використав відкритий API `open.er-api.com` (він безплатний і працює без ключа «з коробки», щоб тобі не довелося реєструватися просто зараз). Якщо захочеш використовувати `currencyfreaks`, просто зміниш URL.

Ось повна структура твого проєкту.

### 1. Файл `.env` (у корені проєкту, поруч із `package.json`)

Тут ми зберігаємо секрети. Цей файл потрібно додати до `.gitignore`, щоб він не потрапив на GitHub.

```env
VITE_CPA_API_KEY=prodcpakey333

```

---

### 2. Файл `src/config.js`

Модуль для зберігання конфігурації. Відокремлюємо налаштування від бізнес-логіки.

```javascript
// Храним все URL адреса в одном месте
export const API_URLS = {
  source1: "https://cpa-server-vtel.onrender.com/api/finance1",
  source2: "https://cpa-server-vtel.onrender.com/api/finance2",
  // Відкритий API курсів валют (базова валюта — USD)
  rates: "https://open.er-api.com/v6/latest/USD",
};

// Формируем заголовки, подтягивая ключ из .env
export const API_HEADERS = {
  "x-api-key": import.meta.env.VITE_CPA_API_KEY,
};
```

---

### 3. Файл `src/api.js`

Модуль для роботи з мережею. Містить ту саму універсальну функцію.

```javascript
import { API_URLS } from "./config.js";

/**
 * Универсальная функция для GET-запросов
 * @param {string} url - Адреса запиту.
 * @param {Object} headers - Об’єкт із заголовками (за замовчуванням порожній).
 */
export async function fetchData(url, headers = {}) {
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Помилка під час завантаження даних із ${url}:`, error.message);
    return null; // Повертаємо null у разі помилки, щоб застосунок не падав
  }
}

/**
 * Запитує актуальні курси валют.
 */
export async function getExchangeRates() {
  const data = await fetchData(API_URLS.rates);

  // Цей API повертає об’єкт rates у форматі { USD: 1, EUR: 0.92, ... }
  if (data && data.rates) {
    return data.rates;
  }

  console.warn(
    "Не вдалося отримати курси валют. Розрахунки можуть бути неточними.",
  );
  return {};
}
```

---

### 4. Файл `src/calculator.js`

Модуль із математикою. До нього винесено логіку конвертації та підсумовування.

```javascript
/**
 * Конвертирует любую валюту в целевую (USD)
 */
function convertToTarget(amount, currency, rates, targetCurrency = "USD") {
  // Приводим "eur" или "usd" к верхнему регистру: "EUR", "USD"
  const upperCurrency = currency.toUpperCase();

  if (upperCurrency === targetCurrency) {
    return amount;
  }

  const rate = rates[upperCurrency]; // Например, 0.92 для EUR

  if (!rate) {
    console.warn(
      `Курс для валюти ${upperCurrency} не знайдено. Суму проігноровано.`,
    );
    return 0;
  }

  // Якщо базова валюта в rates — USD (1 USD = 0.92 EUR),
  // то для переведення 100 EUR у USD потрібно 100 / 0.92
  return amount / rate;
}

/**
 * Розраховує загальну виручку з урахуванням різних валют.
 */
export function calculateTotalRevenue(data1, data2, rates) {
  if (!data1 && !data2) {
    console.error("Помилка: не передано дані для розрахунку виручки.");
    return null;
  }

  let total = 0;
  const targetCurrency = "USD";

  // Джерело 1
  if (Array.isArray(data1?.transactions)) {
    data1.transactions.forEach((transaction) => {
      if (
        transaction.type === "paid" &&
        typeof transaction.amount === "number"
      ) {
        total += convertToTarget(
          transaction.amount,
          transaction.currency,
          rates,
          targetCurrency,
        );
      }
    });
  }

  // Джерело 2
  if (Array.isArray(data2)) {
    data2.forEach((item) => {
      if (typeof item === "string") {
        // Прибираємо зайві пробіли та розбиваємо "300 usd"
        const [amountStr, currency] = item.trim().split(" ");
        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && currency) {
          total += convertToTarget(amount, currency, rates, targetCurrency);
        }
      }
    });
  }

  return {
    // Округлюємо до двох знаків (до центів), оскільки під час конвертації виникають довгі дроби
    total: Number(total.toFixed(2)),
    currency: targetCurrency,
  };
}
```

---

### 5. Файл `src/main.js`

Точка входу застосунку. Оркестратор, який об'єднує всі модулі.

```javascript
import { API_URLS, API_HEADERS } from "./config.js";
import { fetchData, getExchangeRates } from "./api.js";
import { calculateTotalRevenue } from "./calculator.js";

async function init() {
  console.log("Запуск застосунку, завантаження даних...");

  // Використовуємо Promise.all для паралельного завантаження.
  // Ми не чекаємо на кожен запит по черзі, а надсилаємо їх одночасно — це істотно пришвидшує роботу.
  const [data1, data2, rates] = await Promise.all([
    fetchData(API_URLS.source1, API_HEADERS),
    fetchData(API_URLS.source2, API_HEADERS),
    getExchangeRates(),
  ]);

  // Виконуємо розрахунок
  const result = calculateTotalRevenue(data1, data2, rates);

  if (result) {
    console.log("Підсумкова виручка:");
    console.log(result);

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
}

// Запускаем приложение
init();
```

> **Ключовий інсайт щодо продуктивності:** У `main.js` використано конструкцію `Promise.all`. Якщо кожен сервер відповідає за 1 секунду, то 3 запити по черзі (через 3 окремі `await`) зайняли б 3 секунди. З `Promise.all` вони виконуються одночасно, і загальний час становитиме лише 1 секунду (за часом найповільнішого). Для асинхронного JS це стандарт де-факто під час роботи з незалежними ресурсами.

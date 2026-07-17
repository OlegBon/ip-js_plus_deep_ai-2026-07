# Gemini 3.1 Pro через https://gemini.google.com/

## Prompt

Ты senior fullstack разработчик с 10ю годами опыта.
В конце дня в вашу программу из двух разных источников приходят данные о продажах в разном формате. (Зависит от их местного софта)
Источник №1 дает данные:

```javascript
{
   transactions: [
       {
           type: "paid",
           amount: 100,
           currency: "USD",
       },
       {
           type: "pending",
           amount: 50,
           currency: "USD",
       },
       {
           type: "paid",
           amount: 880,
           currency: "USD",
       },
       {
           type: "paid",
           amount: 130,
           currency: "USD",
       },
       {
           type: "rejected",
           amount: 560,
           currency: "USD",
       },
   ],
   address: {
       city: "New York",
       street: "5th Avenue",
       houseNumber: 10,
   },
};
```

Источник №2:

```javascript
["300 USD", "150 USD", "200 USD", "400 USD"];
```

Необходимо реализовать функцию, которая принимает данные из обоих источников и рассчитывает общую выручку за день. Всё в пределах одной функции, используя нативный JS. При этом возвращает данные в формате:

```javascript
{
   total: 5000,
   currency: "USD"
}
```

Где total - это общая сумма, а currency - валюта, в которой сумма. 
При этом из источника №1 берутся только транзакции со статусом paid, остальные игнорируются.

Если не переданы данные из обоих источников - вывести соответствующую ошибку в консоль. Если переданы из одного какого-то источника, то давай придумаем как сделать.

Реализуй в пределах одного файла с исходным примером данных.

## Решение

Привет. Давай решим эту задачу так, как это обычно делается в production — надежно, с защитой от "дурака" (некорректных или отсутствующих данных) и с использованием современных возможностей JavaScript (ES6+).

Так как мы работаем с деньгами, важно всегда проверять типы данных. Если придет только один источник, мы просто посчитаем выручку по нему, а отсутствие второго обработаем без падений (fail-safe). Если не придет ничего — выбросим ошибку в консоль, как ты и просил.

Вот готовое решение в виде единого файла:

```javascript
// --- Исходные данные ---

const source1 = {
  transactions: [
    { type: "paid", amount: 100, currency: "USD" },
    { type: "pending", amount: 50, currency: "USD" },
    { type: "paid", amount: 880, currency: "USD" },
    { type: "paid", amount: 130, currency: "USD" },
    { type: "rejected", amount: 560, currency: "USD" },
  ],
  address: {
    city: "New York",
    street: "5th Avenue",
    houseNumber: 10,
  },
};

const source2 = ["300 USD", "150 USD", "200 USD", "400 USD"];

// --- Основная функция ---

/**
 * Рассчитывает общую выручку из двух разных источников.
 * @param {Object} data1 - Данные из первого источника (объект с транзакциями)
 * @param {Array} data2 - Данные из второго источника (массив строк)
 * @returns {Object|null} Объект с общей суммой и валютой, либо null в случае ошибки
 */
function calculateTotalRevenue(data1, data2) {
  // 1. Проверяем, есть ли вообще данные
  if (!data1 && !data2) {
    console.error(
      "Ошибка: Не переданы данные для расчета выручки (оба источника пусты).",
    );
    return null;
  }

  let total = 0;
  const targetCurrency = "USD"; // Фиксируем валюту вывода согласно требованиям

  // 2. Обработка первого источника (Source 1)
  // Используем optional chaining (?.) на случай, если придет объект без transactions
  if (Array.isArray(data1?.transactions)) {
    total = data1.transactions.reduce((sum, transaction) => {
      // Берем только оплаченные транзакции и проверяем, что amount — это число
      if (
        transaction.type === "paid" &&
        typeof transaction.amount === "number"
      ) {
        return sum + transaction.amount;
      }
      return sum;
    }, total);
  }

  // 3. Обработка второго источника (Source 2)
  if (Array.isArray(data2)) {
    total = data2.reduce((sum, item) => {
      if (typeof item === "string") {
        // Разбиваем строку "300 USD" на ["300", "USD"]
        const [amountStr, currency] = item.split(" ");
        const amount = parseFloat(amountStr);

        // Прибавляем только если удалось распарсить число (защита от битых строк типа "NaN USD")
        if (!isNaN(amount)) {
          return sum + amount;
        }
      }
      return sum;
    }, total);
  }

  // 4. Формируем и возвращаем результат
  return {
    total,
    currency: targetCurrency,
  };
}

// --- Тестирование (Edge cases) ---

console.log("1. Оба источника переданы:");
console.log(calculateTotalRevenue(source1, source2));
// Ожидаем: { total: 2160, currency: 'USD' } -> (100 + 880 + 130) + (300 + 150 + 200 + 400) = 1110 + 1050 = 2160

console.log("\n2. Передан только первый источник (source2 = null):");
console.log(calculateTotalRevenue(source1, null));
// Ожидаем: { total: 1110, currency: 'USD' }

console.log("\n3. Передан только второй источник (source1 = undefined):");
console.log(calculateTotalRevenue(undefined, source2));
// Ожидаем: { total: 1050, currency: 'USD' }

console.log("\n4. Оба источника отсутствуют:");
calculateTotalRevenue(null, undefined);
// Ожидаем: вывод ошибки в console.error
```

### Почему сделано именно так:

- **Optional Chaining (`?.`)**: В строке `Array.isArray(data1?.transactions)` мы защищаем код от падения с `TypeError`, если `data1` придет в виде `{}` (пустого объекта) или `null`.
- **Метод `reduce**`: Это стандартный и самый декларативный способ просуммировать массив в JS. Мы не мутируем внешние переменные внутри циклов `for`.
- **Валидация на лету**: Проверки `typeof transaction.amount === "number"` и `!isNaN(amount)` гарантируют, что если кто-то на бекенде пришлет `amount: "много"` или `amount: null`, наш скрипт не вернет `NaN` в финальном `total`.
- **Слабая связность**: Функция ничего не знает о том, откуда берутся переменные. Если один источник "отвалится", функция просто проигнорирует его блок `if` и спокойно посчитает данные из рабочего источника.

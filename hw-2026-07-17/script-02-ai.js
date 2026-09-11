// --- Вихідні дані ---

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
 * Розраховує загальну виручку з двох різних джерел.
 * @param {Object} data1 - Дані з першого джерела (об’єкт із транзакціями)
 * @param {Array} data2 - Дані з другого джерела (масив рядків)
 * @returns {Object|null} Об’єкт із загальною сумою та валютою або null у разі помилки
 */
function calculateTotalRevenue(data1, data2) {
  // 1. Перевіряємо, чи взагалі є дані
  if (!data1 && !data2) {
    console.error(
      "Помилка: не передано дані для розрахунку виручки (обидва джерела порожні).",
    );
    return null;
  }

  let total = 0;
  const targetCurrency = "USD"; // Фіксуємо валюту виведення відповідно до вимог

  // 2. Обработка первого источника (Source 1)
  // Використовуємо optional chaining (?.), якщо надійде об’єкт без transactions
  if (Array.isArray(data1?.transactions)) {
    total = data1.transactions.reduce((sum, transaction) => {
      // Беремо лише оплачені транзакції та перевіряємо, що amount — це число
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

        // Додаємо, лише якщо вдалося розпарсити число (захист від пошкоджених рядків типу "NaN USD")
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

console.log("1. Передано обидва джерела:");
console.log(calculateTotalRevenue(source1, source2));
// Ожидаем: { total: 2160, currency: 'USD' } -> (100 + 880 + 130) + (300 + 150 + 200 + 400) = 1110 + 1050 = 2160

console.log("\n2. Передано лише перше джерело (source2 = null):");
console.log(calculateTotalRevenue(source1, null));
// Ожидаем: { total: 1110, currency: 'USD' }

console.log("\n3. Передано лише друге джерело (source1 = undefined):");
console.log(calculateTotalRevenue(undefined, source2));
// Ожидаем: { total: 1050, currency: 'USD' }

console.log("\n4. Оба источника отсутствуют:");
calculateTotalRevenue(null, undefined);
// Очікуємо: виведення помилки в console.error

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
      `Курс для валюты ${upperCurrency} не найден. Сумма проигнорирована.`,
    );
    return 0;
  }

  // Если базовая валюта в rates это USD (1 USD = 0.92 EUR),
  // то чтобы перевести 100 EUR в USD, нужно 100 / 0.92
  return amount / rate;
}

/**
 * Рассчитывает общую выручку с учетом разных валют
 */
export function calculateTotalRevenue(data1, data2, rates) {
  if (!data1 && !data2) {
    console.error("Ошибка: Не переданы данные для расчета выручки.");
    return null;
  }

  let total = 0;
  const targetCurrency = "USD";

  // Источник 1
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

  // Источник 2
  if (Array.isArray(data2)) {
    data2.forEach((item) => {
      if (typeof item === "string") {
        // Убираем лишние пробелы и разбиваем "300 usd"
        const [amountStr, currency] = item.trim().split(" ");
        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && currency) {
          total += convertToTarget(amount, currency, rates, targetCurrency);
        }
      }
    });
  }

  return {
    // Округляем до двух знаков (до центов), так как при конвертации получаются длинные дроби
    total: Number(total.toFixed(2)),
    currency: targetCurrency,
  };
}

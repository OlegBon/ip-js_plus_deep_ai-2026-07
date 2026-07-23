/**
 * Конвертирует любую валюту в целевую
 */
export function convertToTarget(
  amount,
  currency,
  rates,
  targetCurrency = "USD",
) {
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

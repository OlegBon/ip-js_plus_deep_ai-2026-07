/**
 * Конвертирует любую валюту в целевую (USD), оперируя центами.
 * @param {number} amountInCents - Сумма в центах
 * @param {string} currency - Исходная валюта
 * @param {Object} rates - Курсы валют
 * @param {string} targetCurrency - Целевая валюта
 * @returns {number} - Сумма в центах целевой валюты, округленная до целого
 */
export function convertToTarget(
  amountInCents,
  currency,
  rates,
  targetCurrency = "USD",
) {
  if (!currency || amountInCents === 0) {
    return 0;
  }

  const upperCurrency = currency.toUpperCase();

  if (upperCurrency === targetCurrency) {
    return amountInCents;
  }

  const rate = rates[upperCurrency];

  if (!rate) {
    console.warn(
      `Курс для валюты ${upperCurrency} не найден. Сумма проигнорирована.`,
    );
    return 0;
  }

  // Конвертируем, сохраняя точность, и округляем до ближайшего цента в самом конце
  const convertedAmount = amountInCents / rate;
  return Math.round(convertedAmount);
}

/**
 * Рассчитывает общую выручку из массива стандартизированных транзакций.
 * @param {Array} transactions - массив формата [{ amountInCents: 10000, currency: 'USD' }]
 * @param {Object} rates - курсы валют
 * @returns {Object} - объект с итоговой суммой в центах
 */
export function calculateTotalRevenue(transactions, rates) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { totalInCents: 0, currency: "USD" };
  }

  const targetCurrency = "USD";

  const totalInCents = transactions.reduce((sum, transaction) => {
    return (
      sum +
      convertToTarget(
        transaction.amountInCents,
        transaction.currency,
        rates,
        targetCurrency,
      )
    );
  }, 0);

  return {
    totalInCents,
    currency: targetCurrency,
  };
}

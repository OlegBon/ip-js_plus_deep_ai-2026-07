/**
 * Конвертує будь-яку валюту в цільову (USD), оперуючи центами.
 * @param {number} amountInCents - Сума в центах.
 * @param {string} currency - Вихідна валюта.
 * @param {Object} rates - Курси валют.
 * @param {string} targetCurrency - Цільова валюта.
 * @returns {number} - Сума в центах цільової валюти, округлена до цілого.
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
      `Курс для валюти ${upperCurrency} не знайдено. Суму проігноровано.`,
    );
    return 0;
  }

  // Конвертуємо зі збереженням точності та округлюємо до найближчого цента лише наприкінці
  const convertedAmount = amountInCents / rate;
  return Math.round(convertedAmount);
}

/**
 * Розраховує загальну виручку з масиву стандартизованих транзакцій.
 * @param {Array} transactions - масив формату [{ amountInCents: 10000, currency: 'USD' }].
 * @param {Object} rates - курси валют.
 * @returns {Object} - об’єкт із підсумковою сумою в центах.
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

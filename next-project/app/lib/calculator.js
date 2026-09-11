/**
 * Конвертує суму в центах з однієї валюти в іншу.
 * @param {number} amountInCents - Сума в центах.
 * @param {string} currency - Вихідна валюта.
 * @param {Object} rates - Об’єкт із курсами валют.
 * @param {string} targetCurrency - Цільова валюта.
 * @returns {number} Сума в центах у цільовій валюті.
 */
export function convertCurrency(
  amountInCents,
  currency,
  rates,
  targetCurrency,
) {
  if (!currency || currency === targetCurrency) {
    return amountInCents;
  }
  const rate = rates[currency];
  if (!rate) {
    console.warn(
      `Курс для валюти ${currency} не знайдено. Суму проігноровано.`,
    );
    return 0; // Якщо курсу немає, сума не враховується
  }

  // (сумма_в_центах / курс_к_USD) -> сумма в USD-центах
  // Math.round для уникнення дробових центів
  return Math.round(amountInCents / rate);
}

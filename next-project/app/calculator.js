/**
 * Конвертирует сумму в центах из одной валюты в другую.
 * @param {number} amountInCents - Сумма в центах.
 * @param {string} currency - Исходная валюта.
 * @param {Object} rates - Объект с курсами валют.
 * @param {string} targetCurrency - Целевая валюта.
 * @returns {number} Сумма в центах в целевой валюте.
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
      `Курс для валюты ${currency} не найден. Сумма проигнорирована.`,
    );
    return 0; // Если курса нет, сумма не учитывается
  }

  // (сумма_в_центах / курс_к_USD) -> сумма в USD-центах
  // Math.round для избежания дробных центов
  return Math.round(amountInCents / rate);
}

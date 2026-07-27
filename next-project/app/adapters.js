/**
 * Адаптирует данные из первого источника к единому формату.
 * @param {Object} data - Исходные данные.
 * @returns {Array} Массив стандартизированных транзакций.
 */
function adaptSource1(data) {
  if (!data?.transactions || !Array.isArray(data.transactions)) {
    return [];
  }
  return data.transactions.map((tx, index) => ({
    id: `s1-${index + 1}`,
    source: "Источник 1",
    type: tx.type,
    // Сразу переводим в центы для точности
    amountInCents: Math.round((tx.amount || 0) * 100),
    currency: tx.currency?.toUpperCase(),
    original: tx,
  }));
}

/**
 * Адаптирует данные из второго источника к единому формату.
 * @param {Array} data - Исходные данные.
 * @returns {Array} Массив стандартизированных транзакций.
 */
function adaptSource2(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item, index) => {
    const id = `s2-${index + 1}`;
    if (typeof item !== "string") {
      return {
        id: `${id}-invalid`,
        source: "Источник 2",
        type: "invalid",
        amountInCents: 0,
        currency: null,
        original: item,
      };
    }
    const [amountStr, currency] = item.split(" ");
    const amount = parseFloat(amountStr);

    return {
      id: id,
      source: "Источник 2",
      // В источнике 2 все транзакции считаются оплаченными
      type: "paid",
      amountInCents: !isNaN(amount) ? Math.round(amount * 100) : 0,
      currency: currency?.toUpperCase(),
      original: item,
    };
  });
}

/**
 * Объединяет и адаптирует данные из всех источников.
 * @param {Object} source1Data - Данные из источника 1.
 * @param {Array} source2Data - Данные из источника 2.
 * @returns {Array} Единый массив всех транзакций.
 */
export function getUnifiedTransactions(source1Data, source2Data) {
  const adapted1 = adaptSource1(source1Data);
  const adapted2 = adaptSource2(source2Data);
  return [...adapted1, ...adapted2];
}

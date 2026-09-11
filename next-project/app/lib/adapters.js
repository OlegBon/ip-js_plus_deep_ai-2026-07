/**
 * Адаптує дані з першого джерела до єдиного формату.
 * @param {Object} data - Вихідні дані.
 * @returns {Array} Масив стандартизованих транзакцій.
 */
function adaptSource1(data) {
  if (!data?.transactions || !Array.isArray(data.transactions)) {
    return [];
  }
  return data.transactions.map((tx, index) => ({
    id: `s1-${index + 1}`,
    source: "Джерело 1",
    type: tx.type,
    // Одразу переводимо в центи для точності
    amountInCents: Math.round((tx.amount || 0) * 100),
    currency: tx.currency?.toUpperCase(),
    original: tx,
  }));
}

/**
 * Адаптує дані з другого джерела до єдиного формату.
 * @param {Array} data - Вихідні дані.
 * @returns {Array} Масив стандартизованих транзакцій.
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
        source: "Джерело 2",
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
      source: "Джерело 2",
      // У джерелі 2 статус не передається, залишаємо порожнім
      type: "",
      amountInCents: !isNaN(amount) ? Math.round(amount * 100) : 0,
      currency: currency?.toUpperCase(),
      original: item,
    };
  });
}

/**
 * Об’єднує та адаптує дані з усіх джерел.
 * @param {Object} source1Data - Дані з джерела 1.
 * @param {Array} source2Data - Дані з джерела 2.
 * @returns {Array} Єдиний масив усіх транзакцій.
 */
export function getUnifiedTransactions(source1Data, source2Data) {
  const adapted1 = adaptSource1(source1Data);
  const adapted2 = adaptSource2(source2Data);
  return [...adapted1, ...adapted2];
}

/**
 * Адаптер для Источника 1
 * Ожидает: объект с массивом transactions.
 * Возвращает: стандартизированный массив транзакций (только оплаченные).
 */
export function adaptSource1(data) {
  if (!data || !Array.isArray(data.transactions)) return [];

  return (
    data.transactions
      // Бизнес-правило: берем только paid
      .filter((t) => t.type === "paid" && typeof t.amount === "number")
      .map((t) => ({
        amount: t.amount,
        currency: t.currency.toUpperCase(), // сразу нормализуем регистр
      }))
  );
}

/**
 * Адаптер для Источника 2
 * Ожидает: массив строк вида "300 usd".
 * Возвращает: стандартизированный массив транзакций.
 */
export function adaptSource2(data) {
  if (!Array.isArray(data)) return [];

  return (
    data
      .map((item) => {
        if (typeof item !== "string") return null;

        const [amountStr, currency] = item.trim().split(" ");
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || !currency) return null;

        return {
          amount,
          currency: currency.toUpperCase(),
        };
      })
      // filter(Boolean) удаляет все null из массива, оставляя только валидные объекты
      .filter(Boolean)
  );
}

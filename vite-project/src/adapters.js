/**
 * Адаптер для Источника 1
 * Ожидает: объект с массивом transactions.
 * Возвращает: объект с включенными (paid) и исключенными транзакциями.
 */
export function adaptSource1(data) {
  const result = {
    included: [],
    excluded: [],
  };

  if (!data || !Array.isArray(data.transactions)) {
    return result;
  }

  data.transactions.forEach((t) => {
    const isValid = t && typeof t.amount === "number" && t.currency;
    if (isValid && t.type === "paid") {
      result.included.push({
        amount: t.amount,
        currency: t.currency.toUpperCase(),
      });
    } else {
      // Сохраняем информацию об исключенных транзакциях
      result.excluded.push({
        amount: isValid ? t.amount : 0,
        currency: isValid ? t.currency.toUpperCase() : "N/A",
        reason: isValid
          ? `Транзакция на ${t.amount} ${t.currency} имеет статус: '${t.type}'`
          : `Некорректные данные транзакции: ${JSON.stringify(t) || '"пусто"'}`,
      });
    }
  });

  return result;
}

/**
 * Адаптер для Источника 2
 * Ожидает: массив строк вида "300 usd".
 * Возвращает: объект с включенными и исключенными транзакциями.
 */
export function adaptSource2(data) {
  const result = {
    included: [],
    excluded: [],
  };

  if (!Array.isArray(data)) {
    return result;
  }

  data.forEach((item) => {
    if (typeof item !== "string") {
      result.excluded.push({
        amount: 0,
        currency: "N/A",
        reason: `Неверный тип данных, ожидалась строка: ${JSON.stringify(item)}`,
      });
      return;
    }

    const parts = item.trim().split(" ");
    const amountStr = parts[0];
    const currency = parts[1];
    const amount = parseFloat(amountStr);

    if (!isNaN(amount) && currency) {
      result.included.push({
        amount,
        currency: currency.toUpperCase(),
      });
    } else {
      result.excluded.push({
        amount: !isNaN(amount) ? amount : 0,
        currency: "N/A",
        reason: `Не удалось обработать строку: "${item}"`,
      });
    }
  });

  return result;
}

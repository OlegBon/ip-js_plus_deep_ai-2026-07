/**
 * Адаптер для джерела 1.
 * Очікує об’єкт із масивом transactions.
 * Повертає об’єкт із включеними (paid) і виключеними транзакціями.
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
        amountInCents: Math.round(t.amount * 100),
        currency: t.currency.toUpperCase(),
      });
    } else {
      // Зберігаємо інформацію про виключені транзакції
      result.excluded.push({
        amountInCents: Math.round((isValid ? t.amount : 0) * 100),
        currency: isValid ? t.currency.toUpperCase() : "N/A",
        reason: isValid
          ? `Транзакція на ${t.amount} ${t.currency} має статус: '${t.type}'`
          : `Некоректні дані транзакції: ${JSON.stringify(t) || '"порожньо"'}`,
      });
    }
  });

  return result;
}

/**
 * Адаптер для джерела 2.
 * Очікує масив рядків на кшталт "300 usd".
 * Повертає об’єкт із включеними та виключеними транзакціями.
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
        amountInCents: 0,
        currency: "N/A",
        reason: `Неправильний тип даних, очікувався рядок: ${JSON.stringify(item)}`,
      });
      return;
    }

    const parts = item.trim().split(" ");
    const amountStr = parts[0];
    const currency = parts[1];
    const amount = parseFloat(amountStr);

    if (!isNaN(amount) && currency) {
      result.included.push({
        amountInCents: Math.round(amount * 100),
        currency: currency.toUpperCase(),
      });
    } else {
      result.excluded.push({
        amountInCents: Math.round((!isNaN(amount) ? amount : 0) * 100),
        currency: "N/A",
        reason: `Не вдалося обробити рядок: "${item}"`,
      });
    }
  });

  return result;
}

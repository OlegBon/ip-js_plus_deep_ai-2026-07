import { convertCurrency } from "./calculator.js";

/**
 * Аналізує транзакції та повертає повну статистику.
 * @param {Array} transactions - Масив уніфікованих транзакцій.
 * @param {Object} rates - Об’єкт із курсами валют.
 * @param {string} targetCurrency - Цільова валюта для підсумкової суми.
 * @returns {Object} Об’єкт із повною аналітикою.
 */
export function analyzeTransactions(
  transactions,
  rates,
  targetCurrency = "USD",
) {
  const analysis = {
    totalRevenueInCents: 0,
    targetCurrency,
    sources: {
      "Джерело 1": {
        included: [],
        excluded: [],
        problems: [],
        currencyStats: {},
        excludedTotalInCents: 0,
      },
      "Джерело 2": {
        included: [],
        excluded: [],
        problems: [],
        currencyStats: {},
        excludedTotalInCents: 0,
      },
    },
    allIncludedTransactions: [],
  };

  transactions.forEach((tx) => {
    const sourceAnalysis = analysis.sources[tx.source];
    if (!sourceAnalysis) return; // Не має траплятися, якщо джерела — «Джерело 1» або «Джерело 2»

    let isProblem = false;
    const problemReasons = [];

    if (!tx.currency || !rates[tx.currency]) {
      problemReasons.push(
        `Немає курсу для ${tx.currency || "невідомої валюти"}`,
      );
      isProblem = true;
    }
    if (tx.amountInCents <= 0) {
      problemReasons.push("Нульова або від’ємна сума");
      isProblem = true;
    }
    if (tx.type === "invalid") {
      problemReasons.push("Невалідний формат даних");
      isProblem = true;
    }

    if ((tx.type === "paid" || tx.type === "") && !isProblem) {
      sourceAnalysis.included.push(tx);
      analysis.allIncludedTransactions.push(tx);

      const convertedAmount = convertCurrency(
        tx.amountInCents,
        tx.currency,
        rates,
        targetCurrency,
      );
      analysis.totalRevenueInCents += convertedAmount;

      // Статистика за валютами
      if (!sourceAnalysis.currencyStats[tx.currency]) {
        sourceAnalysis.currencyStats[tx.currency] = { count: 0, sumInCents: 0 };
      }
      sourceAnalysis.currencyStats[tx.currency].count++;
      sourceAnalysis.currencyStats[tx.currency].sumInCents += tx.amountInCents;
    } else {
      sourceAnalysis.excluded.push(tx);
      // Calculate excluded total in target currency
      sourceAnalysis.excludedTotalInCents += convertCurrency(
        tx.amountInCents,
        tx.currency,
        rates,
        targetCurrency,
      );

      // Add to problems if it's an actual data problem, not just a non-paid status
      if (isProblem) {
        sourceAnalysis.problems.push({
          ...tx,
          reason: problemReasons.join(", "),
        });
      } else if (tx.type !== "paid") {
        // Якщо транзакція не paid і не має проблеми з даними, це проблема статусу
        sourceAnalysis.problems.push({ ...tx, reason: `Статус: '${tx.type}'` });
      }
    }
  });

  const getConvertedAmount = (tx) =>
    convertCurrency(tx.amountInCents, tx.currency, rates, targetCurrency);

  const sortedByValue = [...analysis.allIncludedTransactions].sort(
    (a, b) => getConvertedAmount(a) - getConvertedAmount(b),
  );

  return {
    totalRevenue: (analysis.totalRevenueInCents / 100).toFixed(2),
    currency: targetCurrency,
    sources: analysis.sources,
    allIncludedTransactions: analysis.allIncludedTransactions, // <-- Це додано
    top3Min: sortedByValue
      .slice(0, 3)
      .map((tx) => ({ ...tx, convertedAmountInCents: getConvertedAmount(tx) })),
    top3Max: sortedByValue
      .slice(-3)
      .reverse()
      .map((tx) => ({ ...tx, convertedAmountInCents: getConvertedAmount(tx) })),
    getConvertedAmount, // Exported for use in UI
  };
}

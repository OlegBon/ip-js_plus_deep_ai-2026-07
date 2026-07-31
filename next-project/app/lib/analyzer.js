import { convertCurrency } from "./calculator.js";

/**
 * Анализирует транзакции и возвращает полную статистику.
 * @param {Array} transactions - Массив унифицированных транзакций.
 * @param {Object} rates - Объект с курсами валют.
 * @param {string} targetCurrency - Целевая валюта для итоговой суммы.
 * @returns {Object} Объект с полной аналитикой.
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
      "Источник 1": {
        included: [],
        excluded: [],
        problems: [],
        currencyStats: {},
        excludedTotalInCents: 0,
      },
      "Источник 2": {
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
    if (!sourceAnalysis) return; // Should not happen if sources are "Источник 1" or "Источник 2"

    let isProblem = false;
    const problemReasons = [];

    if (!tx.currency || !rates[tx.currency]) {
      problemReasons.push(
        `Нет курса для ${tx.currency || "неизвестной валюты"}`,
      );
      isProblem = true;
    }
    if (tx.amountInCents <= 0) {
      problemReasons.push("Нулевая или отрицательная сумма");
      isProblem = true;
    }
    if (tx.type === "invalid") {
      problemReasons.push("Невалидный формат данных");
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

      // Статистика по валютам
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
        // If not paid, and not a data problem, it's a status problem
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
    allIncludedTransactions: analysis.allIncludedTransactions, // <-- Вот это добавлено
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

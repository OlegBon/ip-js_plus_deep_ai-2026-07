import { adaptSource1, adaptSource2 } from "./adapters.js";
import { convertToTarget } from "./calculator.js";

/**
 * Groups transactions by a given key (e.g., 'currency')
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} - Stats grouped by currency
 */
function getCurrencyStats(transactions) {
  return transactions.reduce((stats, t) => {
    const currency = t.currency;
    if (!stats[currency]) {
      stats[currency] = { sum: 0, count: 0 };
    }
    stats[currency].sum += t.amount;
    stats[currency].count += 1;
    return stats;
  }, {});
}

/**
 * Analyzes raw data from sources to produce structured stats.
 * @param {Object} rawData1 - Data from source 1
 * @param {Object} rawData2 - Data from source 2
 * @returns {Object} - A structured report object
 */
export function analyzeData(rawData1, rawData2, rates) {
  const adapted1 = adaptSource1(rawData1);
  const adapted2 = adaptSource2(rawData2);

  // Добавляем информацию об источнике в каждую транзакцию
  const transactions1WithSource = adapted1.included.map((t) => ({
    ...t,
    source: "Источник 1",
  }));
  const transactions2WithSource = adapted2.included.map((t) => ({
    ...t,
    source: "Источник 2",
  }));

  const allIncludedTransactions = [
    ...transactions1WithSource,
    ...transactions2WithSource,
  ];

  const currencyStatsBySource = {
    "Источник 1": getCurrencyStats(adapted1.included),
    "Источник 2": getCurrencyStats(adapted2.included),
  };

  const excludedStats = {
    "Источник 1": {
      sum: adapted1.excluded.reduce(
        (sum, t) => sum + convertToTarget(t.amount, t.currency, rates),
        0,
      ),
      count: adapted1.excluded.length,
    },
    "Источник 2": {
      sum: adapted2.excluded.reduce(
        (sum, t) => sum + convertToTarget(t.amount, t.currency, rates),
        0,
      ),
      count: adapted2.excluded.length,
    },
  };

  const dataIssues = {
    "Источник 1": adapted1.excluded,
    "Источник 2": adapted2.excluded,
  };

  return {
    includedTransactions: allIncludedTransactions,
    stats: {
      currencyStatsBySource,
      excludedStats,
    },
    dataIssues,
  };
}

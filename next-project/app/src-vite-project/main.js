import "./style.css";

import { API_URLS, API_HEADERS } from "./config.js";
import { fetchData, getExchangeRates } from "./api.js";
import { analyzeData } from "./analyzer.js";
import { calculateTotalRevenue, convertToTarget } from "./calculator.js";
import { render } from "./ui.js";

async function init() {
  // Initial loading state in UI
  render({ report: null, stats: null, rates: null, error: null });

  try {
    console.log("Загрузка данных...");

    // 1. Fetch all data in parallel
    const [rawData1, rawData2, ratesData] = await Promise.all([
      fetchData(API_URLS.source1, API_HEADERS),
      fetchData(API_URLS.source2, API_HEADERS),
      getExchangeRates(),
    ]);

    // Critical check: if rates are not available, we can't proceed accurately.
    if (
      !ratesData ||
      !ratesData.rates ||
      Object.keys(ratesData.rates).length === 0
    ) {
      throw new Error("Не удалось загрузить курсы валют. Расчет невозможен.");
    }

    // 2. Analyze and structure the data
    const {
      includedTransactions,
      stats: analyzedStats,
      dataIssues,
    } = analyzeData(rawData1, rawData2, ratesData.rates);

    // 3. Calculate the final total revenue
    const finalRevenue = calculateTotalRevenue(
      includedTransactions,
      ratesData.rates,
    );

    // 4. Подготовка расширенной статистики для UI
    const allCurrencies = new Set(["USD"]);
    const stats = {
      ...analyzedStats,
      bySource: {},
    };

    for (const source in analyzedStats.currencyStatsBySource) {
      const sourceTransactions = includedTransactions.filter(
        (t) => t.source === source,
      );
      const sourceRevenue = calculateTotalRevenue(
        sourceTransactions,
        ratesData.rates,
      );
      stats.bySource[source] = {
        currencyStats: analyzedStats.currencyStatsBySource[source],
        totalInTargetCurrency: sourceRevenue.totalInCents,
      };
      Object.keys(analyzedStats.currencyStatsBySource[source]).forEach((c) =>
        allCurrencies.add(c),
      );
    }

    const transactionsWithConvertedAmount = includedTransactions.map((t) => ({
      ...t,
      convertedAmount: convertToTarget(
        t.amountInCents,
        t.currency,
        ratesData.rates,
      ),
    }));
    transactionsWithConvertedAmount.sort(
      (a, b) => a.convertedAmount - b.convertedAmount,
    );

    // 5. Prepare data package for the UI
    const renderData = {
      report: {
        total: (finalRevenue.totalInCents / 100).toFixed(2),
        currency: finalRevenue.currency,
        sources: ["Источник 1", "Источник 2"],
        reportDate: new Date().toLocaleString("ru-RU"),
      },
      stats: stats,
      rates: {
        rates: ratesData.rates,
        ratesDate: new Date(ratesData.time_last_update_utc).toLocaleString(
          "ru-RU",
        ),
        source: API_URLS.rates,
        displayCurrencies: Array.from(allCurrencies),
      },
      extremeTransactions: {
        min: transactionsWithConvertedAmount.slice(0, 3),
        max: transactionsWithConvertedAmount.slice(-3).reverse(),
      },
      dataIssues: dataIssues,
      error: null,
    };

    // 6. Render the final UI
    render(renderData);
  } catch (error) {
    console.error("Критическая ошибка в приложении:", error);
    // Render the error state in the UI
    render({ error });
  }
}

// Запускаем приложение
init();

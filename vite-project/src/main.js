import "./style.css";

import { API_URLS, API_HEADERS } from "./config.js";
import { fetchData, getExchangeRates } from "./api.js";
import { adaptSource1, adaptSource2 } from "./adapters.js";
import { calculateTotalRevenue } from "./calculator.js";

async function init() {
  console.log("Загрузка данных...");

  const [rawData1, rawData2, rates] = await Promise.all([
    fetchData(API_URLS.source1, API_HEADERS),
    fetchData(API_URLS.source2, API_HEADERS),
    getExchangeRates(),
  ]);

  // 1. Пропускаем данные через адаптеры
  const standardTransactions1 = adaptSource1(rawData1);
  const standardTransactions2 = adaptSource2(rawData2);

  // 2. Объединяем в один плоский массив
  // Spread-оператор (...) разворачивает оба массива в один общий
  const allTransactions = [...standardTransactions1, ...standardTransactions2];

  // 3. Считаем итог
  const result = calculateTotalRevenue(allTransactions, rates);

  console.log("Итоговая выручка:", result);

  // Можно вывести результат прямо на страницу (если в index.html есть <div id="app"></div>)
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Итоговая выручка за день:</h2>
          <h1 style="color: green;">${result.total} ${result.currency}</h1>
        </div>
      `;
  }
}

// Запускаем приложение
init();

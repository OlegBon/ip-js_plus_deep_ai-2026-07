import "./style.css";

import { API_URLS, API_HEADERS } from "./config.js";
import { fetchData, getExchangeRates } from "./api.js";
import { calculateTotalRevenue } from "./calculator.js";

async function init() {
  console.log("Запуск приложения, загрузка данных...");

  // Используем Promise.all для параллельной загрузки.
  // Мы не ждем каждый запрос по очереди, а отправляем их одновременно — это сильно ускоряет работу.
  const [data1, data2, rates] = await Promise.all([
    fetchData(API_URLS.source1, API_HEADERS),
    fetchData(API_URLS.source2, API_HEADERS),
    getExchangeRates(),
  ]);

  // Выполняем расчет
  const result = calculateTotalRevenue(data1, data2, rates);

  if (result) {
    console.log("Итоговая выручка:");
    console.log(result);

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
}

// Запускаем приложение
init();

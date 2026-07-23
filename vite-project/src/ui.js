const app = document.querySelector("#app");

/**
 * Helper to create styled elements
 * @param {string} tag - HTML tag
 * @param {string} classes - Tailwind classes
 * @param {string} text - Text content
 * @returns {HTMLElement}
 */
function createElement(tag, classes = "", text = "") {
  const el = document.createElement(tag);
  if (classes) el.className = classes;
  if (text) el.textContent = text;
  return el;
}

/**
 * Renders the main report section
 */
function renderReport(container, { total, currency, sources, reportDate }) {
  const reportEl = createElement(
    "div",
    "bg-white p-6 rounded-lg shadow-md mb-6",
  );
  reportEl.innerHTML = `
    <h2 class="text-2xl font-bold text-gray-800 mb-2">Итоговый отчёт</h2>
    <p class="text-gray-600">Дата: ${reportDate}</p>
    <div class="mt-4 text-center">
      <p class="text-lg text-gray-700">Общая выручка</p>
      <p class="text-5xl font-extrabold text-green-600">${total} ${currency}</p>
    </div>
    <div class="mt-4 text-sm text-gray-500">
      <p>Источники данных: ${sources.join(", ")}</p>
    </div>
  `;
  container.appendChild(reportEl);
}

/**
 * Renders currency statistics
 */
function renderStats(container, { bySource, excludedStats }) {
  const statsEl = createElement("div", "grid md:grid-cols-2 gap-6 mb-6");

  // Included stats by source
  const includedCard = createElement(
    "div",
    "bg-white p-6 rounded-lg shadow-md",
  );
  includedCard.innerHTML = `<h3 class="text-xl font-semibold text-gray-700 mb-4">Статистика по валютам (включено в расчёт)</h3>`;
  const sourcesList = createElement("div", "space-y-6");

  for (const [sourceName, sourceStats] of Object.entries(bySource)) {
    const sourceBlock = createElement("div");
    const title = createElement(
      "h4",
      "font-bold text-gray-800 border-b pb-2 mb-2",
      sourceName,
    );
    sourceBlock.appendChild(title);

    const currencyList = createElement("ul", "space-y-2");
    for (const [currency, stats] of Object.entries(sourceStats.currencyStats)) {
      const item = createElement(
        "li",
        "flex justify-between items-center text-gray-600 text-sm",
      );
      item.innerHTML = `
        <span>
          <span class="font-bold text-indigo-600">${currency}</span>: ${stats.count} транзакций
        </span>
        <span class="font-semibold">${stats.sum.toFixed(2)}</span>
      `;
      currencyList.appendChild(item);
    }
    sourceBlock.appendChild(currencyList);

    const total = createElement(
      "p",
      "text-right font-bold text-gray-700 mt-2 pt-2 border-t",
    );
    total.innerHTML = `Итого по источнику: <span class="text-green-600">${sourceStats.totalInTargetCurrency.toFixed(2)} USD</span>`;
    sourceBlock.appendChild(total);

    sourcesList.appendChild(sourceBlock);
  }

  includedCard.appendChild(sourcesList);
  statsEl.appendChild(includedCard);

  // Excluded stats
  const excludedCard = createElement(
    "div",
    "bg-white p-6 rounded-lg shadow-md",
  );
  excludedCard.innerHTML = `<h3 class="text-xl font-semibold text-gray-700 mb-4">Транзакции, не вошедшие в расчёт</h3>`;
  const excludedList = createElement("ul", "space-y-2");
  for (const [source, stats] of Object.entries(excludedStats)) {
    const item = createElement(
      "li",
      "flex justify-between items-center text-gray-600 text-sm",
    );
    item.innerHTML = `
      <span>
        <span class="font-bold">${source}</span>: ${stats.count} транзакций
      </span>
      <span class="font-semibold">${stats.sum.toFixed(2)} USD</span>
    `;
    excludedList.appendChild(item);
  }
  excludedCard.appendChild(excludedList);
  statsEl.appendChild(excludedCard);

  container.appendChild(statsEl);
}

/**
 * Renders exchange rate information
 */
function renderExchangeRates(
  container,
  { rates, ratesDate, source, displayCurrencies },
) {
  if (!rates || Object.keys(rates).length === 0) return;

  const ratesEl = createElement("div", "bg-white p-6 rounded-lg shadow-md");
  ratesEl.innerHTML = `
    <h3 class="text-xl font-semibold text-gray-700 mb-4">Курсы валют</h3>
    <p class="text-sm text-gray-500 mb-1">Относительно USD на ${ratesDate}</p>
    <p class="text-xs text-gray-400 mb-3">Источник: ${source}</p>
  `;
  const list = createElement(
    "div",
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm",
  );
  // Отобразим только некоторые популярные валюты для чистоты интерфейса
  for (const currency of displayCurrencies) {
    if (rates[currency]) {
      const item = createElement("p", "bg-gray-100 p-2 rounded");
      item.innerHTML = `<span class="font-bold">${currency}:</span> ${rates[currency]}`;
      list.appendChild(item);
    }
  }
  ratesEl.appendChild(list);
  container.appendChild(ratesEl);
}

/**
 * Renders min/max transactions
 */
function renderExtremeTransactions(container, { min, max }) {
  const extremeEl = createElement("div", "grid md:grid-cols-2 gap-6 mb-6");

  const renderList = (title, transactions, color) => {
    const card = createElement("div", "bg-white p-6 rounded-lg shadow-md");
    card.innerHTML = `<h3 class="text-xl font-semibold text-gray-700 mb-4">${title}</h3>`;
    const list = createElement("ul", "space-y-3");
    if (transactions.length === 0) {
      list.innerHTML = `<li class="text-gray-500">Нет данных для отображения.</li>`;
    } else {
      transactions.forEach((t) => {
        const item = createElement("li", "text-gray-600");
        item.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="text-sm">${t.source}</span>
            <span class="font-bold text-lg ${color}">${t.amount.toFixed(2)} ${t.currency}</span>
          </div>
          <div class="text-right text-xs text-gray-400">
            ~${t.convertedAmount.toFixed(2)} USD
          </div>
        `;
        list.appendChild(item);
      });
    }
    card.appendChild(list);
    return card;
  };

  const minCard = renderList(
    "Топ-3 минимальных транзакций",
    min,
    "text-red-600",
  );
  extremeEl.appendChild(minCard);

  const maxCard = renderList(
    "Топ-3 максимальных транзакций",
    max,
    "text-green-600",
  );
  extremeEl.appendChild(maxCard);

  const wrapper = createElement("div");
  const title = createElement(
    "h2",
    "text-2xl font-bold text-gray-800 mb-2",
    "Анализ транзакций",
  );
  wrapper.appendChild(title);
  wrapper.appendChild(extremeEl);

  container.appendChild(wrapper);
}

/**
 * Renders data quality issues block
 * @param {HTMLElement} container
 * @param {Object} dataIssues
 */
function renderDataIssues(container, dataIssues) {
  const issuesCard = createElement(
    "div",
    "bg-white p-6 rounded-lg shadow-md mt-6",
  );
  issuesCard.innerHTML = `<h2 class="text-2xl font-bold text-gray-800 mb-4">Проблемы в исходных данных</h2>`;

  const allIssues = [...dataIssues["Источник 1"], ...dataIssues["Источник 2"]];

  if (allIssues.length === 0) {
    const successMessage = createElement(
      "div",
      "bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded",
    );
    successMessage.innerHTML = `<p class="font-bold">Отлично!</p><p>Проблем в исходных данных не обнаружено. Все транзакции были обработаны корректно.</p>`;
    issuesCard.appendChild(successMessage);
    container.appendChild(issuesCard);
    return;
  }

  const issuesWrapper = createElement("div", "space-y-4");

  for (const [source, issues] of Object.entries(dataIssues)) {
    const sourceBlock = createElement("div");
    const title = createElement(
      "h3",
      "font-semibold text-gray-700 mb-2",
      source,
    );
    sourceBlock.appendChild(title);

    if (issues.length > 0) {
      const list = createElement(
        "ul",
        "list-disc list-inside space-y-1 text-sm text-red-700",
      );
      issues.slice(0, 5).forEach((issue) => {
        list.innerHTML += `<li>${issue.reason}</li>`;
      });

      if (issues.length > 5) {
        list.innerHTML += `<li class="text-gray-500 italic">... и еще ${issues.length - 5} проблем.</li>`;
      }

      sourceBlock.appendChild(list);
    } else {
      const noIssuesMessage = createElement(
        "p",
        "text-sm text-green-700 italic",
        "Проблем не обнаружено.",
      );
      sourceBlock.appendChild(noIssuesMessage);
    }
    issuesWrapper.appendChild(sourceBlock);
  }

  issuesCard.appendChild(issuesWrapper);
  container.appendChild(issuesCard);
}

/**
 * Renders an error message in the UI
 */
function renderError(container, error) {
  container.innerHTML = ""; // Clear previous content
  const errorEl = createElement(
    "div",
    "bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md",
    "",
  );
  errorEl.setAttribute("role", "alert");
  errorEl.innerHTML = `
    <p class="font-bold">Произошла ошибка</p>
    <p>${error.message}</p>
  `;
  container.appendChild(errorEl);
}

/**
 * Main render function
 */
export function render(data) {
  app.innerHTML =
    '<div class="text-center p-10"><p class="text-gray-500">Загрузка отчёта...</p></div>';
  app.className = "bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8";

  if (data.error) {
    renderError(app, data.error);
    return;
  }

  if (data.report) {
    app.innerHTML = ""; // Clear loading message
    const { report, stats, rates, extremeTransactions, dataIssues } = data;
    renderReport(app, report);
    renderStats(app, stats);
    renderExtremeTransactions(app, extremeTransactions);
    renderExchangeRates(app, rates);
    renderDataIssues(app, dataIssues);
  }
}

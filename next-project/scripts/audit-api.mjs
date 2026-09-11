import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUnifiedTransactions } from "../app/lib/adapters.js";
import { analyzeTransactions } from "../app/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

// Шукаємо ключ у process.env, потім у .env.local, потім у .env
let apiKey = process.env.CPA_API_KEY;

if (!apiKey) {
  const envLocalPath = path.join(ROOT_DIR, ".env.local");
  const envPath = path.join(ROOT_DIR, ".env");
  let envContent = "";

  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, "utf-8");
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  const match = envContent.match(/CPA_API_KEY=(.*)/);
  if (match) {
    // Очищуємо ключ від можливих лапок і пробілів
    apiKey = match[1].replace(/['"]/g, "").trim();
  }
}

const AUDIT_DIR = path.join(ROOT_DIR, "docs", "audits");
const LATEST_REPORT_PATH = path.join(AUDIT_DIR, "api-audit-latest.md");
const CALCULATION_SOURCES_PATH = path.join(
  AUDIT_DIR,
  "calculation-sources.json",
);

const API_URLS = {
  source1: "https://cpa-server-vtel.onrender.com/api/finance1",
  source2: "https://cpa-server-vtel.onrender.com/api/finance2",
  rates: "https://open.er-api.com/v6/latest/USD",
};

async function fetchApi(url, requireKey = false) {
  const headers = requireKey ? { "x-api-key": apiKey } : {};
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function runAudit() {
  console.log("🚀 Запуск аудиту API...");

  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }

  const [res1, res2, resRates] = await Promise.all([
    fetchApi(API_URLS.source1, true),
    fetchApi(API_URLS.source2, true),
    fetchApi(API_URLS.rates),
  ]);

  const rates = resRates.success ? resRates.data.rates : null;
  let report = `# Звіт аудиту API - ${new Date().toISOString()}\n\n`;

  const statuses = {
    "Джерело 1": res1.success ? "✅ OK" : `❌ Помилка (${res1.error})`,
    "Джерело 2": res2.success ? "✅ OK" : `❌ Помилка (${res2.error})`,
    "Курси валют": resRates.success ? "✅ OK" : `❌ Помилка (${resRates.error})`,
  };

  report += `## Статус ендпойнтів\n`;
  for (const [source, status] of Object.entries(statuses)) {
    report += `- ${source}: ${status}\n`;
  }
  report += "\n";

  // --- Генерування Markdown-звіту (стара логіка) ---
  report += `## Аналіз джерела 1 (finance1)\n`;
  if (res1.success && rates) {
    let hasErrors = false;
    res1.data.transactions.forEach((tx, i) => {
      if (tx.amount <= 0) {
        report += `- Транзакція [${i}]: Сума <= 0 (${tx.amount})\n`;
        hasErrors = true;
      }
      if (tx.type !== "paid") {
        report += `- Транзакція [${i}]: Статус не 'paid' (${tx.type})\n`;
        hasErrors = true;
      }
      if (tx.currency !== tx.currency.toUpperCase()) {
        report += `- Транзакція [${i}]: Валюта в нижньому регістрі (${tx.currency})\n`;
        hasErrors = true;
      }
      if (!rates[tx.currency?.toUpperCase()]) {
        report += `- Транзакція [${i}]: Невідома валюта (${tx.currency})\n`;
        hasErrors = true;
      }
    });
    if (!hasErrors) report += `✅ Аномалій не знайдено.\n`;
  }

  report += `\n## Аналіз джерела 2 (finance2)\n`;
  if (res2.success && rates) {
    let hasErrors = false;
    res2.data.forEach((item, i) => {
      if (typeof item !== "string") {
        report += `- Запис [${i}]: Очікувався рядок, отримано ${typeof item}\n`;
        hasErrors = true;
      } else {
        const [amountStr, currency] = item.split(" ");
        if (isNaN(parseFloat(amountStr))) {
          report += `- Запис [${i}]: Невалідна сума (${amountStr})\n`;
          hasErrors = true;
        }
        if (currency && !rates[currency.toUpperCase()]) {
          report += `- Запис [${i}]: Невідома валюта (${currency})\n`;
          hasErrors = true;
        }
      }
    });
    if (!hasErrors) report += `✅ Аномалій не знайдено.\n`;
  }

  fs.writeFileSync(LATEST_REPORT_PATH, report);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(path.join(AUDIT_DIR, `api-audit-${timestamp}.md`), report);
  console.log(`✅ Markdown-звіт збережено в ${LATEST_REPORT_PATH}`);

  // --- Нова логіка: аналіз і збереження даних для розрахунків ---
  if (res1.success && res2.success && resRates.success) {
    const unifiedTransactions = getUnifiedTransactions(res1.data, res2.data);
    analyzeTransactions(unifiedTransactions, rates, "USD");

    const calculationTransactions = unifiedTransactions.map(
      (tx) => ({
        source: tx.source,
        amount: (tx.amountInCents / 100).toFixed(2),
        currency: tx.currency,
        status: tx.type,
      }),
    );

    const CALCULATION_TRANSACTIONS_PATH = path.join(
      AUDIT_DIR,
      "calculation-transactions.json",
    );

    fs.writeFileSync(
      CALCULATION_TRANSACTIONS_PATH,
      JSON.stringify(calculationTransactions, null, 2),
    );
    console.log(
      `✅ Транзакції для розрахунків збережено в ${CALCULATION_TRANSACTIONS_PATH}`,
    );
  } else {
    console.warn(
      "⚠️ Не вдалося отримати всі дані, файл із транзакціями для розрахунків не створено.",
    );
    // Створюємо порожній файл, якщо його немає, щоб сторінка не ламалася
    const CALCULATION_TRANSACTIONS_PATH = path.join(
        AUDIT_DIR,
        "calculation-transactions.json",
      );
    if (!fs.existsSync(CALCULATION_TRANSACTIONS_PATH)) {
      fs.writeFileSync(CALCULATION_TRANSACTIONS_PATH, "[]");
    }
  }
}

runAudit();

// Зберігаємо всі URL-адреси в одному місці
export const API_URLS = {
  source1: "https://cpa-server-vtel.onrender.com/api/finance1",
  source2: "https://cpa-server-vtel.onrender.com/api/finance2",
  // Відкритий API курсів валют (базова валюта — USD)
  rates: "https://open.er-api.com/v6/latest/USD",
};

// Формуємо заголовки, отримуючи ключ із .env
// У Next.js змінні на сервері доступні через process.env
export const API_HEADERS = {
  "x-api-key": process.env.CPA_API_KEY,
};

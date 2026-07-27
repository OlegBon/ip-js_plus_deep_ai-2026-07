// Храним все URL адреса в одном месте
export const API_URLS = {
  source1: "https://cpa-server-vtel.onrender.com/api/finance1",
  source2: "https://cpa-server-vtel.onrender.com/api/finance2",
  // Открытый API курсов валют (базовая валюта - USD)
  rates: "https://open.er-api.com/v6/latest/USD",
};

// Формируем заголовки, подтягивая ключ из .env
// В Next.js на сервере переменные доступны через process.env
export const API_HEADERS = {
  "x-api-key": process.env.CPA_API_KEY,
};

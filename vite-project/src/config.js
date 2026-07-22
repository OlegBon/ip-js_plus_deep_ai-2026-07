// Храним все URL адреса в одном месте
export const API_URLS = {
  source1: "https://cpa-server-vtel.onrender.com/api/finance1",
  source2: "https://cpa-server-vtel.onrender.com/api/finance2",
  // Открытый API курсов валют (базовая валюта - USD)
  rates: "https://open.er-api.com/v6/latest/USD",
};

// Формируем заголовки, подтягивая ключ из .env
export const API_HEADERS = {
  "x-api-key": import.meta.env.VITE_CPA_API_KEY,
};

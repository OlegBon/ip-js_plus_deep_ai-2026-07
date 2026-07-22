import { API_URLS } from "./config.js";

/**
 * Универсальная функция для GET-запросов
 * @param {string} url - Адрес запроса
 * @param {Object} headers - Объект с заголовками (по умолчанию пустой)
 */
export async function fetchData(url, headers = {}) {
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка при загрузке данных с ${url}:`, error.message);
    return null; // Возвращаем null при ошибке, чтобы приложение не падало
  }
}

/**
 * Запрашивает актуальные курсы валют
 */
export async function getExchangeRates() {
  const data = await fetchData(API_URLS.rates);

  // Этот API возвращает объект rates в формате { USD: 1, EUR: 0.92, ... }
  if (data && data.rates) {
    return data.rates;
  }

  console.warn(
    "Не удалось получить курсы валют. Расчеты могут быть неточными.",
  );
  return {};
}

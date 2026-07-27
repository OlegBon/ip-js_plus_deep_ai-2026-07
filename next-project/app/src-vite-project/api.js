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

  // Возвращаем весь объект, он содержит дату и сами курсы
  if (data && data.rates && data.time_last_update_utc) {
    return data;
  }

  console.warn(
    "Не удалось получить курсы валют. Расчеты могут быть неточными.",
  );
  return null;
}

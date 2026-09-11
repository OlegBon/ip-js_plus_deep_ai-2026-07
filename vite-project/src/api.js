import { API_URLS } from "./config.js";

/**
 * Універсальна функція для GET-запитів.
 * @param {string} url - Адреса запиту.
 * @param {Object} headers - Об’єкт із заголовками (за замовчуванням порожній).
 */
export async function fetchData(url, headers = {}) {
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Помилка під час завантаження даних із ${url}:`, error.message);
    return null; // Повертаємо null у разі помилки, щоб застосунок не падав
  }
}

/**
 * Запитує актуальні курси валют.
 */
export async function getExchangeRates() {
  const data = await fetchData(API_URLS.rates);

  // Повертаємо весь об’єкт: він містить дату й самі курси
  if (data && data.rates && data.time_last_update_utc) {
    return data;
  }

  console.warn(
    "Не вдалося отримати курси валют. Розрахунки можуть бути неточними.",
  );
  return null;
}

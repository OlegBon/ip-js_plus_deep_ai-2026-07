import { API_URLS, API_HEADERS } from "./config.js";

/**
 * Универсальная функция для GET-запросов.
 * Next.js расширяет fetch, добавляя возможности кэширования и дедупликации.
 * @param {string} url - Адрес запроса
 * @param {Object} options - Опции для fetch (включая headers)
 */
export async function fetchData(url, options = {}) {
  try {
    // Используем revalidate, чтобы данные кэшировались, но периодически обновлялись.
    // 3600 секунд = 1 час.
    const response = await fetch(url, {
      ...options,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка при загрузке данных с ${url}:`, error.message);
    return null; // Возвращаем null при ошибке, чтобы приложение не падало
  }
}

/**
 * Запрашивает все необходимые данные параллельно.
 */
export function fetchAllData() {
  return Promise.all([
    fetchData(API_URLS.source1, { headers: API_HEADERS }),
    fetchData(API_URLS.source2, { headers: API_HEADERS }),
    fetchData(API_URLS.rates),
  ]);
}

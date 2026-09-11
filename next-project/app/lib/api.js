import { API_URLS, API_HEADERS } from "./config.js";

/**
 * Універсальна функція для GET-запитів.
 * Next.js розширює fetch, додаючи можливості кешування та дедуплікації.
 * @param {string} url - Адреса запиту.
 * @param {Object} options - Опції для fetch (включно з headers).
 */
export async function fetchData(url, options = {}) {
  try {
    // Використовуємо revalidate, щоб дані кешувалися, але періодично оновлювалися.
    // 3600 секунд = 1 година.
    const response = await fetch(url, {
      ...options,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Помилка під час завантаження даних із ${url}:`, error.message);
    return null; // Повертаємо null у разі помилки, щоб застосунок не падав
  }
}

/**
 * Запитує всі потрібні дані паралельно.
 */
export function fetchAllData() {
  return Promise.all([
    fetchData(API_URLS.source1, { headers: API_HEADERS }),
    fetchData(API_URLS.source2, { headers: API_HEADERS }),
    fetchData(API_URLS.rates),
  ]);
}

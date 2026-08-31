const databaseName = 'convertly-guest-results';
const storeName = 'results';

export type GuestConversionResult = {
  id: string;
  blob: Blob | null;
  fileName: string;
  expiresAt: number;
};

export async function loadGuestConversionResults(now = Date.now()) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  const results = (await requestAsPromise(store.getAll())) as GuestConversionResult[];
  const retainedResults = results.map((result) => {
    if (result.expiresAt > now || result.blob === null) return result;
    const expiredResult = { ...result, blob: null };
    store.put(expiredResult);
    return expiredResult;
  });
  await transactionAsPromise(transaction);
  database.close();
  return retainedResults.sort((left, right) => right.expiresAt - left.expiresAt);
}

export async function saveGuestConversionResult(result: GuestConversionResult) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(result);
  await transactionAsPromise(transaction);
  database.close();
}

export async function expireGuestConversionResult(result: GuestConversionResult) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put({ ...result, blob: null });
  await transactionAsPromise(transaction);
  database.close();
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestAsPromise(request: IDBRequest) {
  return new Promise<unknown>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionAsPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

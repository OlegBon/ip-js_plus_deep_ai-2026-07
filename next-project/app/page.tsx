import { fetchAllData } from "./lib/api";
import { getUnifiedTransactions } from "./lib/adapters";
import { analyzeTransactions } from "./lib/analyzer"; // Assuming analyzer.ts is already in lib
import { API_URLS } from "./lib/config";
import type { ReactNode } from "react";

// --- Типи для аналітики ---
interface Transaction {
  id: string;
  source: string;
  type: string;
  amountInCents: number;
  currency?: string;
  original: unknown;
}

interface ProblemTransaction extends Transaction {
  reason: string;
}

interface TopTransaction extends Transaction {
  convertedAmountInCents: number;
}

interface CurrencyStats {
  [currency: string]: {
    count: number;
    sumInCents: number;
  };
}

interface SourceAnalysis {
  included: Transaction[];
  excluded: Transaction[];
  problems: ProblemTransaction[];
  currencyStats: CurrencyStats;
  excludedTotalInCents: number;
}

interface AnalysisResult {
  totalRevenue: string;
  currency: string;
  sources: Record<string, SourceAnalysis>;
  top3Min: TopTransaction[];
  top3Max: TopTransaction[];
  getConvertedAmount: (tx: Transaction) => number;
}

// Допоміжні компоненти для чистоти коду
const Section = ({
  title,
  children,
  colSpan = "lg:col-span-1",
}: {
  title: string;
  children: ReactNode;
  colSpan?: string;
}) => (
  <div
    className={`p-6 bg-white rounded-xl shadow-lg border border-gray-200 ${colSpan}`}
  >
    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

const SubSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="mt-4">
    <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
    <div className="border-t border-gray-200 mt-2 pt-2">{children}</div>
  </div>
);

export default async function Home() {
  const [source1Data, source2Data, ratesData] = await fetchAllData();

  if (!source1Data || !source2Data || !ratesData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-red-50 text-red-800">
        <h1 className="text-4xl font-bold">Помилка завантаження даних</h1>
        <p className="mt-4 text-lg">
          Не вдалося отримати дані з одного або кількох джерел.
          Перевірте консоль сервера, щоб отримати додаткову інформацію.
        </p>
      </main>
    );
  }

  const allTransactions = getUnifiedTransactions(source1Data, source2Data);
  const analysis = analyzeTransactions(
    allTransactions,
    ratesData.rates,
    "USD",
  ) as AnalysisResult;
  const reportDate = new Date().toLocaleString("ru-RU");
  const ratesDate = new Date(ratesData.time_last_update_utc).toLocaleString(
    "ru-RU",
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-gray-100 text-gray-800">
      <div className="w-full max-w-7xl space-y-8">
        {/* Блок 1: Підсумковий звіт */}
        <Section title="Підсумковий звіт">
          <p className="text-sm text-gray-500">Дата: {reportDate}</p>
          <div className="text-center my-6">
            <p className="text-lg text-gray-600">Загальна виручка</p>
            <p className="text-5xl font-bold text-green-600">
              {analysis.totalRevenue} {analysis.currency}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Джерела даних: {Object.keys(analysis.sources).join(", ")}
          </p>
        </Section>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Блок 2: Статистика */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <SubSection title="Статистика за валютами (включено до розрахунку)">
              {Object.entries(analysis.sources).map(
                ([sourceName, sourceData]) => (
                  <div
                    key={sourceName}
                    className="mb-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">
                      {sourceName}
                    </h4>
                    <ul className="text-sm space-y-1 mt-2">
                      {Object.entries(sourceData.currencyStats).map(
                        ([currency, stats]) => {
                          return (
                            <li
                              key={currency}
                              className="flex justify-between items-center text-gray-600 text-sm"
                            >
                              <span>
                                <span className="font-bold text-indigo-600">
                                  {currency}
                                </span>
                                : {stats.count} транзакций
                              </span>
                              <span className="font-semibold">
                                {(stats.sumInCents / 100).toFixed(2)}
                              </span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span className="font-semibold">Итого по источнику:</span>
                      <span className="text-green-600">
                        {(
                          sourceData.included.reduce<number>(
                            (sum, tx: Transaction) =>
                              sum + analysis.getConvertedAmount(tx),
                            0,
                          ) / 100
                        ).toFixed(2)}{" "}
                        {analysis.currency}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </SubSection>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <SubSection title="Транзакції, що не увійшли до розрахунку">
              {Object.entries(analysis.sources).map(
                ([sourceName, sourceData]) => (
                  <div
                    key={sourceName}
                    className="flex justify-between text-gray-600 text-sm"
                  >
                    <span>
                      <span className="font-bold">{sourceName}</span>:{" "}
                      {sourceData.excluded.length} транзакций
                    </span>
                    <span className="font-semibold">
                      {(sourceData.excludedTotalInCents / 100).toFixed(2)}{" "}
                      {analysis.currency}
                    </span>
                  </div>
                ),
              )}
            </SubSection>
          </div>
        </div>

        {/* Блок 3: Анализ транзакций */}
        <Section title="Анализ транзакций">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SubSection title="Топ-3 мінімальних транзакцій">
              <ul className="space-y-2">
                {analysis.top3Min.map((tx) => (
                  <li key={tx.id} className="text-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{tx.source}</span>
                      <span className="font-bold text-lg text-red-600">
                        {(tx.amountInCents / 100).toFixed(2)} {tx.currency}
                      </span>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      ~{(tx.convertedAmountInCents / 100).toFixed(2)}{" "}
                      {analysis.currency}
                    </div>
                  </li>
                ))}
              </ul>
            </SubSection>
            <SubSection title="Топ-3 максимальних транзакцій">
              <ul className="space-y-2">
                {analysis.top3Max.map((tx) => (
                  <li key={tx.id} className="text-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{tx.source}</span>
                      <span className="font-bold text-lg text-green-600">
                        {(tx.amountInCents / 100).toFixed(2)} {tx.currency}
                      </span>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      ~{(tx.convertedAmountInCents / 100).toFixed(2)}{" "}
                      {analysis.currency}
                    </div>
                  </li>
                ))}
              </ul>
            </SubSection>
          </div>
        </Section>

        {/* Блок 4: Курси валют */}
        <Section title="Курси валют">
          <p className="text-sm text-gray-500">
            Относительно {analysis.currency} на {ratesDate}
          </p>
          <p className="text-xs text-gray-400 truncate">
            Джерело:{" "}
            <a href={API_URLS.rates} className="hover:underline">
              {API_URLS.rates}
            </a>
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {ratesData.rates &&
              Object.entries(ratesData.rates)
                .filter(([currency]) => ["USD", "EUR"].includes(currency))
                .map(([currency, rate]) => (
                  <li key={currency} className="bg-gray-100 p-2 rounded">
                    <span>{currency}:</span>
                    <span>{String(rate)}</span>
                  </li>
                ))}
          </ul>
        </Section>

        {/* Блок 5: Проблеми */}
        <Section title="Проблеми у вихідних даних">
          {Object.entries(analysis.sources).map(([sourceName, sourceData]) => (
            <div key={sourceName} className="mb-4">
              <h4 className="font-bold text-gray-700">{sourceName}</h4>
              {sourceData.problems.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-amber-800 space-y-1 mt-2">
                  {sourceData.problems.map((tx) => (
                    <li key={tx.id}>
                      Транзакція{" "}
                      <span className="font-mono">
                        {(tx.amountInCents / 100).toFixed(2)}{" "}
                        {tx.currency || ""}
                      </span>{" "}
                      имеет проблему: {tx.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-700 mt-2">
                  Проблем не обнаружено.
                </p>
              )}
            </div>
          ))}
        </Section>
      </div>
    </main>
  );
}

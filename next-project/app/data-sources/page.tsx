
import { promises as fs } from "fs";
import path from "path";
import type { ReactNode } from "react";

// --- Reusable Components ---
const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

// --- Data Parsing Logic & Types ---

// Types for Markdown-based audit
interface EndpointStatus {
  title: string;
  status: string;
}

interface SourceAnalysis {
  title: string;
  problems: string[];
}

interface ParsedAudit {
  statuses: EndpointStatus[];
  analyses: SourceAnalysis[];
}

// Types for JSON-based calculation data
interface CalculationTransaction {
  source: string;
  amount: string;
  currency: string;
  status: string;
}

async function parseAuditFile(): Promise<ParsedAudit> {
  const filePath = path.join(
    process.cwd(),
    "docs",
    "audits",
    "api-audit-latest.md",
  );
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    const statuses: EndpointStatus[] = [];
    const analyses: SourceAnalysis[] = [];

    let mode: "statuses" | "analysis" | "none" = "none";
    let currentAnalysis: SourceAnalysis | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("## Статус эндпоинтов")) {
        mode = "statuses";
        if (currentAnalysis) {
          analyses.push(currentAnalysis);
          currentAnalysis = null;
        }
        continue;
      }

      if (trimmedLine.startsWith("## Анализ")) {
        mode = "analysis";
        if (currentAnalysis) {
          analyses.push(currentAnalysis);
        }
        const rawTitle = trimmedLine.replace("## Анализ", "").trim();
        const title = rawTitle.split("(")[0].trim();
        currentAnalysis = { title, problems: [] };
        continue;
      }

      if (trimmedLine === "") {
        if (mode === "statuses") mode = "none";
        continue;
      }

      if (mode === "statuses" && trimmedLine.startsWith("-")) {
        const [title, status] = trimmedLine.slice(1).split(":");
        if (title && status) {
          statuses.push({ title: title.trim(), status: status.trim() });
        }
      }

      if (mode === "analysis" && currentAnalysis) {
        if (trimmedLine.startsWith("-")) {
          currentAnalysis.problems.push(trimmedLine.slice(1).trim());
        }
        if (trimmedLine.includes("Аномалий не найдено")) {
          // This section is clean, do nothing.
        }
      }
    }

    if (currentAnalysis) {
      analyses.push(currentAnalysis);
    }

    return { statuses, analyses };
  } catch (error) {
    console.error("Error reading or parsing audit file:", error);
    return { statuses: [], analyses: [] };
  }
}

async function getCalculationTransactions(): Promise<CalculationTransaction[]> {
    const filePath = path.join(
      process.cwd(),
      "docs",
      "audits",
      "calculation-transactions.json"
    );
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Error reading or parsing calculation sources file:", error);
      return [];
    }
  }


// --- Page Component ---
export default async function DataSourcesPage() {
  const { statuses, analyses } = await parseAuditFile();
  const calculationTransactions = await getCalculationTransactions();
  const reportDate = new Date().toLocaleString("ru-RU");

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-gray-100 text-gray-800">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-right text-sm text-gray-500">
          Отчет сгенерирован: {reportDate}
        </div>

        <Section title="Статус эндпоинтов">
          <div className="space-y-2">
            {statuses.length > 0 ? (
              statuses.map(({ title, status }) => (
                <div
                  key={title}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-800">{title}</span>
                  <span
                    className={`font-bold ${
                      status.includes("OK")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                Не удалось загрузить статусы эндпоинтов.
              </p>
            )}
          </div>
        </Section>

        <Section title="Источники данных для расчетов">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-700">Источник</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-700">Сумма</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-700">Статус</th>
                </tr>
              </thead>
              <tbody>
                {calculationTransactions.length > 0 ? (
                  calculationTransactions.map((tx, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 px-4">
                        <span className="font-medium">{tx.source}</span>
                      </td>
                      <td className="py-3 px-4">
                          <div>
                            <span className="font-mono text-green-700 font-semibold">{tx.amount}</span>
                            <span className="ml-2 text-gray-500">{tx.currency}</span>
                          </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{tx.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">
                      Данные для расчетов не загружены.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Детальный анализ источников">
          {analyses.length > 0 ? (
            analyses.map((source) => (
              <div key={source.title} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-3">
                  {source.title}
                </h3>
                {source.problems.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-amber-800 space-y-1 pl-2">
                    {source.problems.map((problem, index) => (
                      <li key={index}>{problem}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-700">Проблем не обнаружено.</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              Детальный анализ источников не загружен.
            </p>
          )}
        </Section>
      </div>
    </main>
  );
}


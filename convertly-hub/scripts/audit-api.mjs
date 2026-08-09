import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const AUDIT_DIR = path.join(ROOT_DIR, "docs", "audits");
const LATEST_REPORT_PATH = path.join(AUDIT_DIR, "api-audit-latest.md");

const ENDPOINTS = [
  { name: "Gotenberg Worker", url: "http://localhost:3000" },
  { name: "Gotenberg Health", url: "http://localhost:3000/health", type: "gotenberg_health" },
  { name: "Convertly Hub App", url: "http://localhost:3001" },
  { name: "Convertly Hub Health API", url: "http://localhost:3001/api/health", type: "convertly_health" },
  { name: "MinIO UI", url: "http://localhost:9001" },
  { name: "MinIO UI Login", url: "http://localhost:9001/login" },
];

async function fetchEndpoint(endpoint) {
  try {
    const res = await fetch(endpoint.url, { cache: "no-store" });
    if (!res.ok) {
      return { success: false, status: `❌ Ошибка (HTTP ${res.status})` };
    }

    const result = { success: true, status: "✅ OK" };

    if (endpoint.type && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        result.details = parseHealthDetails(endpoint.type, data);
    }
    
    return result;

  } catch (e) {
    return { success: false, status: `❌ Ошибка (${e.message})` };
  }
}

function parseHealthDetails(type, data) {
    const details = [];
    if (type === 'gotenberg_health' && data.details) {
        details.push(`  - Chromium: ${data.details.chromium?.status === 'up' ? '✅ up' : '❌ down'}`);
        details.push(`  - LibreOffice: ${data.details.libreoffice?.status === 'up' ? '✅ up' : '❌ down'}`);
    } else if (type === 'convertly_health') {
        details.push(`  - Status: ${data.status === 'healthy' ? '✅ healthy' : `❌ ${data.status}`}`);
        details.push(`  - Database: ${data.database === 'connected' ? '✅ connected' : `❌ ${data.database}`}`);
        details.push(`  - Gotenberg Worker: ${data.gotenberg_worker === 'up' ? '✅ up' : `❌ ${data.gotenberg_worker}`}`);
    }
    return details;
}

async function runAudit() {
  console.log("🚀 Запуск аудита API...");

  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }

  let report = `# Отчет аудита API - ${new Date().toISOString()}\n\n`;
  report += `## Статус эндпоинтов\n`;

  const results = await Promise.all(ENDPOINTS.map(fetchEndpoint));

  ENDPOINTS.forEach((endpoint, i) => {
    const result = results[i];
    report += `- ${endpoint.name} (${endpoint.url}): ${result.status}\n`;
    if(result.details && result.details.length > 0) {
        report += result.details.join('\n') + '\n';
    }
  });

  fs.writeFileSync(LATEST_REPORT_PATH, report);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const timestampedReportPath = path.join(AUDIT_DIR, `api-audit-${timestamp}.md`);
  fs.writeFileSync(timestampedReportPath, report);

  console.log(`✅ Отчет аудита сохранен в ${LATEST_REPORT_PATH} и ${timestampedReportPath}`);
}

runAudit();

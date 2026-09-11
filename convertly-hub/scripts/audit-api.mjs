import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const AUDIT_DIR = path.join(ROOT_DIR, 'docs', 'audits');
const LATEST_REPORT_PATH = path.join(AUDIT_DIR, 'api-audit-latest.md');
const LOCAL_APP_URL = 'http://localhost:3001';

function getAuditTarget() {
  const configuredUrl = process.env.API_AUDIT_BASE_URL?.trim() || LOCAL_APP_URL;
  let baseUrl;

  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    throw new Error('API_AUDIT_BASE_URL має бути коректною HTTP(S)-адресою.');
  }

  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new Error('API_AUDIT_BASE_URL має використовувати протокол HTTP або HTTPS.');
  }

  baseUrl.pathname = '/';
  baseUrl.search = '';
  baseUrl.hash = '';

  return {
    baseUrl: baseUrl.toString().replace(/\/$/, ''),
    isLocal: ['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname),
  };
}

function createEndpoints({ baseUrl, isLocal }) {
  const appUrl = (pathname = '/') => new URL(pathname, `${baseUrl}/`).toString();
  const endpoints = [
    { name: 'Convertly Hub App', url: appUrl() },
    { name: 'Convertly Hub Health API', url: appUrl('/api/health'), type: 'convertly_health' },
    {
      name: 'NextAuth Session',
      url: appUrl('/api/auth/session'),
      type: 'expected_status',
      expectedStatus: 200,
    },
    {
      name: 'Account Profile (guest boundary)',
      url: appUrl('/api/account/profile'),
      type: 'expected_status',
      expectedStatus: 401,
    },
    {
      name: 'Account Billing (guest boundary)',
      url: appUrl('/api/account/billing'),
      type: 'expected_status',
      expectedStatus: 401,
    },
    {
      name: 'Account Conversions (guest boundary)',
      url: appUrl('/api/account/conversions'),
      type: 'expected_status',
      expectedStatus: 401,
    },
    {
      name: 'Account API Keys (guest boundary)',
      url: appUrl('/api/account/api-keys'),
      type: 'expected_status',
      expectedStatus: 401,
    },
    {
      name: 'Admin Users (guest boundary)',
      url: appUrl('/api/admin/users'),
      type: 'expected_status',
      expectedStatus: 401,
    },
    {
      name: 'Admin Metrics (guest boundary)',
      url: appUrl('/api/admin/metrics'),
      type: 'expected_status',
      expectedStatus: 401,
    },
  ];

  if (!isLocal) return endpoints;

  return [
    { name: 'Gotenberg Worker', url: 'http://localhost:3000' },
    { name: 'Gotenberg Health', url: 'http://localhost:3000/health', type: 'gotenberg_health' },
    ...endpoints,
    { name: 'MinIO UI', url: 'http://localhost:9001' },
    { name: 'MinIO UI Login', url: 'http://localhost:9001/login' },
  ];
}

async function fetchEndpoint(endpoint) {
  try {
    const res = await fetch(endpoint.url, { cache: 'no-store' });
    if (endpoint.type === 'expected_status') {
      return {
        success: res.status === endpoint.expectedStatus,
        status:
          res.status === endpoint.expectedStatus
            ? `✅ Очікуваний HTTP ${res.status}`
            : `❌ Очікувався HTTP ${endpoint.expectedStatus}, отримано ${res.status}`,
      };
    }
    if (!res.ok) {
      return { success: false, status: `❌ Помилка (HTTP ${res.status})` };
    }

    const result = { success: true, status: '✅ OK' };

    if (endpoint.type && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      result.details = parseHealthDetails(endpoint.type, data);
    }

    return result;
  } catch (e) {
    return { success: false, status: `❌ Помилка (${e.message})` };
  }
}

function parseHealthDetails(type, data) {
  const details = [];
  if (type === 'gotenberg_health' && data.details) {
    details.push(`  - Chromium: ${data.details.chromium?.status === 'up' ? '✅ up' : '❌ down'}`);
    details.push(
      `  - LibreOffice: ${data.details.libreoffice?.status === 'up' ? '✅ up' : '❌ down'}`,
    );
  } else if (type === 'convertly_health') {
    details.push(`  - Status: ${data.status === 'healthy' ? '✅ healthy' : `❌ ${data.status}`}`);
    details.push(`  - Database: ${data.database === 'up' ? '✅ up' : `❌ ${data.database}`}`);
    details.push(`  - S3 Storage: ${data.storage === 'up' ? '✅ up' : `❌ ${data.storage}`}`);
    details.push(
      `  - Gotenberg Worker: ${data.gotenberg === 'up' ? '✅ up' : `❌ ${data.gotenberg}`}`,
    );
  }
  return details;
}

async function runAudit() {
  console.log('🚀 Запуск аудиту API...');
  const target = getAuditTarget();
  const endpoints = createEndpoints(target);

  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }

  let report = `# Звіт аудиту API - ${new Date().toISOString()}\n\n`;
  report += `## Ціль\n- Режим: ${target.isLocal ? 'локальний' : 'віддалений'}\n- Public app: ${target.baseUrl}\n\n`;
  report += `## Статус ендпойнтів\n`;

  const results = await Promise.all(endpoints.map(fetchEndpoint));

  endpoints.forEach((endpoint, i) => {
    const result = results[i];
    report += `- ${endpoint.name} (${endpoint.url}): ${result.status}\n`;
    if (result.details && result.details.length > 0) {
      report += result.details.join('\n') + '\n';
    }
  });

  fs.writeFileSync(LATEST_REPORT_PATH, report);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedReportPath = path.join(AUDIT_DIR, `api-audit-${timestamp}.md`);
  fs.writeFileSync(timestampedReportPath, report);

  console.log(`✅ Звіт аудиту збережено у ${LATEST_REPORT_PATH} і ${timestampedReportPath}`);
}

runAudit();

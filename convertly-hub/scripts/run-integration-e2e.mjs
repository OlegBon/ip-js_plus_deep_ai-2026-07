import { spawn } from 'node:child_process';

const integrationEnvironment = {
  ...process.env,
  NODE_ENV: 'test',
  NEXT_DIST_DIR: '.next-integration',
  NEXTAUTH_URL: 'http://127.0.0.1:3101',
  NEXTAUTH_SECRET: 'integration-only-nextauth-secret-change-me',
  DATABASE_URL:
    'postgresql://convertly_integration:convertly-integration-password@127.0.0.1:55432/convertly_integration?schema=public',
  MINIO_ENDPOINT: 'http://127.0.0.1:59000',
  MINIO_ACCESS_KEY: 'convertly-integration',
  MINIO_SECRET_KEY: 'convertly-integration-secret',
  MINIO_BUCKET: 'convertly-integration-files',
  GOTENBERG_URL: 'http://127.0.0.1:53000',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '51025',
  SMTP_FROM: 'Convertly Hub Integration <no-reply@integration.local>',
  SMTP_SECURE: 'false',
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const child = spawn(
      isWindows ? (process.env.ComSpec ?? 'cmd.exe') : command,
      isWindows ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args,
      {
        cwd: process.cwd(),
        env: integrationEnvironment,
        stdio: 'inherit',
      },
    );
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}.`));
    });
  });
}

const servicesManagedByCi = process.env.INTEGRATION_SERVICES_MANAGED === 'true';

if (!servicesManagedByCi) {
  await run('docker', [
    'compose',
    '-p',
    'convertly-integration',
    '-f',
    'docker-compose.integration.yml',
    'up',
    '-d',
    'db',
    'minio',
    'gotenberg',
    'mailhog',
  ]);
  await run('docker', [
    'compose',
    '-p',
    'convertly-integration',
    '-f',
    'docker-compose.integration.yml',
    '--profile',
    'init',
    'run',
    '--rm',
    'minio-init',
  ]);
}

try {
  await run('npx', ['prisma', 'generate']);
  await run('npx', ['prisma', 'migrate', 'deploy']);
  await run('npx', ['playwright', 'test', '--config=playwright.integration.config.ts']);
} finally {
  if (!servicesManagedByCi) {
    await run('docker', [
      'compose',
      '-p',
      'convertly-integration',
      '-f',
      'docker-compose.integration.yml',
      'down',
      '--volumes',
    ]);
  }
}

import { expect, test, type APIRequestContext } from '@playwright/test';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { getStorageService } from '@/lib/storage/s3';

const password = 'Integration password 2026!';
const storedKeys: string[] = [];

test.beforeAll(async () => {
  await prisma.roleChangeAudit.deleteMany();
  await prisma.guestConversionQuota.deleteMany();
  await prisma.conversionLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
});

test.afterAll(async () => {
  await Promise.all(storedKeys.map((key) => getStorageService().deleteFile(key)));
  await prisma.roleChangeAudit.deleteMany();
  await prisma.guestConversionQuota.deleteMany();
  await prisma.conversionLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

test('реальные сервисы поддерживают auth, квоты, API-конвертацию и администрирование', async ({
  request,
}) => {
  await waitForHealthySystem(request);

  const user = await registerAndSignIn(request);
  const apiKey = await createApiKey(request);
  const png = await createImage('png');
  const jpg = await createImage('jpg');

  const storedConversion = await request.post('/api/v1/convert', {
    headers: { Authorization: `Bearer ${apiKey}` },
    multipart: {
      file: { name: 'stored.png', mimeType: 'image/png', buffer: png },
      targetFormat: 'jpg',
    },
  });
  expect(storedConversion.status()).toBe(202);
  const storedBody = (await storedConversion.json()) as { conversionId: string };
  const storedDownload = await waitForDownload(request, storedBody.conversionId, apiKey);
  expect(storedDownload.headers()['content-type']).toContain('image/jpeg');
  expect((await storedDownload.body()).length).toBeGreaterThan(100);

  const storedLog = await prisma.conversionLog.findUniqueOrThrow({
    where: { id: storedBody.conversionId },
    select: { status: true, storageKey: true },
  });
  expect(storedLog.status).toBe('COMPLETED');
  expect(storedLog.storageKey).toBeTruthy();
  storedKeys.push(storedLog.storageKey as string);

  await prisma.user.update({ where: { id: user.id }, data: { storeConversions: false } });
  const streamedConversion = await request.post('/api/v1/convert', {
    headers: { Authorization: `Bearer ${apiKey}` },
    multipart: {
      file: { name: 'private.jpg', mimeType: 'image/jpeg', buffer: jpg },
      targetFormat: 'png',
    },
  });
  expect(streamedConversion.status()).toBe(200);
  expect(streamedConversion.headers()['content-type']).toContain('image/png');
  const streamedBody = await streamedConversion.body();
  expect(streamedBody.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  const streamedLog = await prisma.conversionLog.findFirstOrThrow({
    where: { userId: user.id, sourceFileName: 'private.jpg' },
    select: { status: true, storageKey: true },
  });
  expect(streamedLog.status).toBe('COMPLETED');
  expect(streamedLog.storageKey).toBeNull();

  await verifyGuestQuota(request, png);
  await verifyDocumentConversion(request);

  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  const adminUsers = await request.get('/api/admin/users');
  await expect(adminUsers).toBeOK();
  const adminBody = (await adminUsers.json()) as { users: Array<{ id: string }> };
  expect(adminBody.users.some(({ id }) => id === user.id)).toBe(true);
});

async function registerAndSignIn(request: APIRequestContext) {
  const email = `integration-${crypto.randomUUID()}@example.test`;
  const registration = await request.post('/api/auth/register', {
    data: { email, password, name: 'Integration User' },
  });
  expect(registration.status()).toBe(201);
  await waitForVerificationEmail(email);

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'BASIC',
      subscription: {
        upsert: {
          create: { activePlan: 'BASIC' },
          update: { activePlan: 'BASIC', requestedPlan: null, status: 'ACTIVE' },
        },
      },
    },
  });

  const csrfResponse = await request.get('/api/auth/csrf');
  await expect(csrfResponse).toBeOK();
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const callback = await request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: 'http://127.0.0.1:3101/',
    },
    maxRedirects: 0,
  });
  expect(callback.status()).toBe(302);

  const session = await request.get('/api/auth/session');
  await expect(session).toBeOK();
  expect(await session.json()).toEqual(
    expect.objectContaining({ user: expect.objectContaining({ id: user.id, email }) }),
  );
  return user;
}

type MailHogMessage = {
  Content?: {
    Headers?: Record<string, string[]>;
  };
};

async function waitForVerificationEmail(email: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch('http://127.0.0.1:58025/api/v2/messages');
    if (response.ok) {
      const body = (await response.json()) as { items?: MailHogMessage[] };
      const found = body.items?.some((message) => {
        const headers = message.Content?.Headers;
        return (
          headers?.To?.includes(email) &&
          headers.Subject?.includes('Verify your Convertly Hub email')
        );
      });
      if (found) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`MailHog did not receive an email verification message for ${email}.`);
}

async function createApiKey(request: APIRequestContext) {
  const response = await request.post('/api/account/api-keys', {
    data: { name: 'Integration key' },
  });
  expect(response.status()).toBe(201);
  const body = (await response.json()) as { secret: string };
  expect(body.secret).toMatch(/^ch_live_/);
  return body.secret;
}

async function waitForDownload(request: APIRequestContext, conversionId: string, apiKey: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await request.get(`/api/v1/conversions/${conversionId}/download`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok()) return response;
    expect(response.status()).toBe(409);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Stored conversion did not finish in time.');
}

async function waitForHealthySystem(request: APIRequestContext) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const response = await request.get('/api/health');
    if (response.ok()) {
      expect(await response.json()).toEqual({
        status: 'healthy',
        database: 'up',
        storage: 'up',
        gotenberg: 'up',
      });
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Integration services did not become healthy in 60 seconds.');
}

async function verifyGuestQuota(request: APIRequestContext, png: Buffer) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await request.post('/api/guest/conversions', {
      multipart: {
        file: { name: `guest-${attempt}.png`, mimeType: 'image/png', buffer: png },
        targetFormat: 'jpg',
      },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['x-guest-image-remaining']).toBe(String(2 - attempt));
  }

  const quotaExceeded = await request.post('/api/guest/conversions', {
    multipart: {
      file: { name: 'guest-limit.png', mimeType: 'image/png', buffer: png },
      targetFormat: 'jpg',
    },
  });
  expect(quotaExceeded.status()).toBe(429);
}

async function verifyDocumentConversion(request: APIRequestContext) {
  const response = await request.post('/api/guest/conversions', {
    multipart: {
      file: {
        name: 'integration.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: createMinimalDocx(),
      },
      targetFormat: 'pdf',
    },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect((await response.body()).subarray(0, 4).toString()).toBe('%PDF');
}

function createImage(format: 'jpg' | 'png') {
  return sharp({ create: { width: 2, height: 2, channels: 3, background: '#1273de' } })
    .toFormat(format === 'jpg' ? 'jpeg' : 'png')
    .toBuffer();
}

function createMinimalDocx() {
  return createStoredZip([
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ],
    [
      'word/document.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Convertly Hub integration test</w:t></w:r></w:p><w:sectPr/></w:body></w:document>',
    ],
  ]);
}

function createStoredZip(entries: Array<[string, string]>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of entries) {
    const fileName = Buffer.from(name);
    const body = Buffer.from(content);
    const crc = crc32(body);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    localParts.push(local, fileName, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(body.length, 24);
    central.writeUInt16LE(fileName.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, fileName);
    offset += local.length + fileName.length + body.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

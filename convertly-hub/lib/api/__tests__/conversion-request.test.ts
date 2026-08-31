import { createHash } from 'crypto';
import {
  authenticateApiKey,
  createConversionRequest,
  isMultipartFormData,
} from '../conversion-request';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: { findUnique: jest.fn() },
    conversionLog: { count: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const mockedPrisma = jest.mocked(prisma, { shallow: false });
const principal = { apiKeyId: 'key-1', userId: 'user-1', storeConversions: true };

function makeFile(name = 'image.png', type = 'image/png', size = 4) {
  return { name, type, size } as File;
}

describe('conversion request service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.conversionLog.count.mockResolvedValue(0);
  });

  it('authenticates an active, non-revoked API key by its hash', async () => {
    mockedPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      userId: 'user-1',
      revokedAt: null,
      user: { status: 'ACTIVE', storeConversions: true },
    } as never);

    await expect(authenticateApiKey('Bearer secret-api-key')).resolves.toEqual(principal);
    expect(mockedPrisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash: createHash('sha256').update('secret-api-key').digest('hex') },
      select: expect.any(Object),
    });
  });

  it('rejects malformed, revoked, and inactive API keys', async () => {
    await expect(authenticateApiKey('Basic token')).resolves.toBeNull();

    mockedPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      userId: 'user-1',
      revokedAt: new Date(),
      user: { status: 'ACTIVE', storeConversions: true },
    } as never);
    await expect(authenticateApiKey('Bearer revoked-key')).resolves.toBeNull();
  });

  it('validates target format and source file before creating a database record', async () => {
    await expect(
      createConversionRequest(principal, { file: makeFile(), targetFormat: 'exe' }),
    ).resolves.toEqual({ error: 'UNSUPPORTED_TARGET_FORMAT' });
    await expect(
      createConversionRequest(principal, {
        file: makeFile('archive.zip', 'application/zip'),
        targetFormat: 'pdf',
      }),
    ).resolves.toEqual({ error: 'UNSUPPORTED_FILE' });
    await expect(
      createConversionRequest(principal, {
        file: makeFile('large.png', 'image/png', 10 * 1024 * 1024 + 1),
        targetFormat: 'pdf',
      }),
    ).resolves.toEqual({ error: 'FILE_TOO_LARGE' });
    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates a pending conversion and updates API-key use time atomically', async () => {
    const transaction = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      conversionLog: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({
          id: 'conversion-1',
          status: 'PENDING',
          createdAt: new Date('2026-08-24T12:00:00.000Z'),
        }),
      },
      apiKey: { update: jest.fn().mockResolvedValue({}) },
    };
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback(transaction as never),
    );

    await expect(
      createConversionRequest(principal, { file: makeFile('../image.png'), targetFormat: 'PDF' }),
    ).resolves.toEqual({
      conversion: {
        id: 'conversion-1',
        status: 'PENDING',
        createdAt: new Date('2026-08-24T12:00:00.000Z'),
      },
    });
    expect(transaction.conversionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sourceFileName: '.._image.png', targetFormat: 'pdf' }),
      }),
    );
    expect(transaction.conversionLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] } }),
      }),
    );
    expect(transaction.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it('reuses an active stored result with the same source hash and target format without consuming quota', async () => {
    const transaction = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      conversionLog: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing-conversion' }),
        count: jest.fn(),
        create: jest.fn(),
      },
      apiKey: { update: jest.fn() },
    };
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback(transaction as never),
    );

    await expect(
      createConversionRequest(principal, {
        file: makeFile(),
        targetFormat: 'png',
        sourceFileHash: 'safe-content-hash',
        reuseStoredResult: true,
      }),
    ).resolves.toEqual({ existingConversion: { id: 'existing-conversion' } });

    expect(transaction.conversionLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          sourceFileHash: 'safe-content-hash',
          targetFormat: 'png',
          status: 'COMPLETED',
        }),
      }),
    );
    expect(transaction.conversionLog.count).not.toHaveBeenCalled();
    expect(transaction.conversionLog.create).not.toHaveBeenCalled();
  });

  it('recognises multipart content types', () => {
    expect(isMultipartFormData('multipart/form-data; boundary=test')).toBe(true);
    expect(isMultipartFormData('application/json')).toBe(false);
  });
});

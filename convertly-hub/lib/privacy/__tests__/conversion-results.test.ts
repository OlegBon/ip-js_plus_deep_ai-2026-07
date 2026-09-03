import { Readable } from 'stream';
import {
  createStoredConversionKey,
  downloadStoredConversion,
  storeConversionResult,
  StoredConversionNotFoundError,
} from '../conversion-results';
import { prisma } from '@/lib/prisma';
import { getStorageService } from '@/lib/storage/s3';

jest.mock('@/lib/prisma', () => ({ prisma: { conversionLog: { findFirst: jest.fn() } } }));
jest.mock('@/lib/storage/s3', () => ({ getStorageService: jest.fn() }));

const mockedPrisma = jest.mocked(prisma, { shallow: false });
const mockedGetStorageService = jest.mocked(getStorageService);
const storage = { uploadFile: jest.fn(), downloadFile: jest.fn() };

describe('conversion result privacy service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetStorageService.mockReturnValue(storage as never);
  });

  it('stores result under a user-scoped private S3 key', async () => {
    storage.uploadFile.mockResolvedValue(undefined);
    const storageKey = await storeConversionResult({
      conversionId: 'conversion-1',
      userId: 'user-1',
      fileName: 'report final.pdf',
      mimeType: 'application/pdf',
      data: Buffer.from('pdf'),
    });

    expect(storageKey).toBe('users/user-1/conversions/conversion-1/result.pdf');
    expect(storage.uploadFile).toHaveBeenCalledWith({
      key: storageKey,
      body: Buffer.from('pdf'),
      contentType: 'application/pdf',
      contentLength: 3,
    });
  });

  it('does not reveal a result that does not belong to the API-key user', async () => {
    mockedPrisma.conversionLog.findFirst.mockResolvedValue(null);

    await expect(
      downloadStoredConversion({ conversionId: 'another-user-result', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(StoredConversionNotFoundError);
    expect(storage.downloadFile).not.toHaveBeenCalled();
  });

  it('returns a private stored result as a web stream', async () => {
    mockedPrisma.conversionLog.findFirst.mockResolvedValue({
      storageKey: 'users/user-1/conversions/conversion-1/report.pdf',
      resultFileName: 'report.pdf',
      resultMimeType: 'application/pdf',
    } as never);
    storage.downloadFile.mockResolvedValue({ Body: Readable.from([Buffer.from('pdf')]) });

    const result = await downloadStoredConversion({
      conversionId: 'conversion-1',
      userId: 'user-1',
    });

    const reader = result.body.getReader();
    const chunks: Uint8Array[] = [];
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      chunks.push(chunk.value);
    }
    expect(Buffer.concat(chunks).toString()).toBe('pdf');
    expect(result).toEqual(
      expect.objectContaining({ fileName: 'report.pdf', mimeType: 'application/pdf' }),
    );
  });

  it('keeps the storage key independent of user-controlled result names', () => {
    expect(
      createStoredConversionKey({
        conversionId: 'conversion-1',
        userId: 'user-1',
        fileName: 'Звіт 100% #1 (final).pdf',
        mimeType: 'application/pdf',
        data: Buffer.alloc(0),
      }),
    ).toBe('users/user-1/conversions/conversion-1/result.pdf');
  });
});

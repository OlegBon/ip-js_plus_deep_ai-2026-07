import { processConversionJob } from '../conversion-job';
import { convertFile } from '../conversion';
import { storeConversionResult } from '@/lib/privacy/conversion-results';
import { prisma } from '@/lib/prisma';
import { reserveStorageCapacity } from '@/lib/billing/subscriptions';

jest.mock('@/lib/core/conversion', () => ({ convertFile: jest.fn() }));
jest.mock('@/lib/privacy/conversion-results', () => ({ storeConversionResult: jest.fn() }));
jest.mock('@/lib/storage/s3', () => ({ getStorageService: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: { conversionLog: { updateMany: jest.fn(), update: jest.fn() } },
}));
jest.mock('@/lib/billing/subscriptions', () => ({
  reserveStorageCapacity: jest.fn(),
  StorageQuotaExceededError: class StorageQuotaExceededError extends Error {},
}));

const mockedConvertFile = jest.mocked(convertFile);
const mockedStoreConversionResult = jest.mocked(storeConversionResult);
const mockedPrisma = jest.mocked(prisma, { shallow: false });
const mockedReserveStorageCapacity = jest.mocked(reserveStorageCapacity);
const job = {
  conversionId: 'conversion-1',
  data: Buffer.from([0xff, 0xd8, 0xff]),
  sourceFileName: 'photo.jpg',
  sourceMimeType: 'image/jpeg',
  targetFormat: 'png',
  userId: 'user-1',
  storeResult: false,
};

describe('conversion job', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedReserveStorageCapacity.mockResolvedValue(undefined);
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it('marks a pending conversion completed after Core returns a result', async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedConvertFile.mockResolvedValue({
      data: Buffer.from('png'),
      fileName: 'photo.png',
      mimeType: 'image/png',
    });
    mockedPrisma.conversionLog.update.mockResolvedValue({} as never);

    await processConversionJob(job);

    expect(mockedPrisma.conversionLog.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.objectContaining({ status: 'PROCESSING' }) }),
    );
    expect(mockedPrisma.conversionLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          resultFileName: 'photo.png',
          resultMimeType: 'image/png',
          resultSize: BigInt(3),
        }),
      }),
    );
  });

  it('marks the job failed without exposing a worker error', async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValueOnce({ count: 1 } as never);
    mockedConvertFile.mockRejectedValue(new Error('Gotenberg internals'));

    await processConversionJob(job);

    expect(mockedPrisma.conversionLog.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Conversion failed. Check the source file and try again.',
        }),
      }),
    );
  });

  it('stores a completed result only when the user enabled storage', async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedConvertFile.mockResolvedValue({
      data: Buffer.from('png'),
      fileName: 'photo.png',
      mimeType: 'image/png',
    });
    mockedStoreConversionResult.mockResolvedValue(
      'users/user-1/conversions/conversion-1/photo.png',
    );
    mockedPrisma.conversionLog.update.mockResolvedValue({} as never);

    await processConversionJob({ ...job, storeResult: true });

    expect(mockedReserveStorageCapacity).toHaveBeenCalledWith(
      'user-1',
      'FREE',
      'conversion-1',
      BigInt(3),
    );

    expect(mockedStoreConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({ conversionId: 'conversion-1', userId: 'user-1' }),
    );
    expect(mockedPrisma.conversionLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storageKey: 'users/user-1/conversions/conversion-1/photo.png',
        }),
      }),
    );
  });

  it('records a safe storage-upload diagnostic while preserving the public failure message', async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedConvertFile.mockResolvedValue({
      data: Buffer.from('pdf'),
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
    });
    const storageError = Object.assign(new Error('s3://credentials-must-not-be-logged'), {
      code: 'SlowDown',
      $metadata: { httpStatusCode: 503, requestId: 'storage-request-1' },
    });
    mockedStoreConversionResult.mockRejectedValue(storageError);

    await processConversionJob({ ...job, storeResult: true });

    expect(consoleError).toHaveBeenCalledWith(
      'Conversion job failed.',
      expect.objectContaining({
        conversionId: 'conversion-1',
        stage: 'storage-upload',
        errorName: 'Error',
        code: 'SlowDown',
        httpStatusCode: 503,
        requestId: 'storage-request-1',
      }),
    );
    expect(consoleError.mock.calls[0]?.[1]).not.toHaveProperty('message');
    expect(mockedPrisma.conversionLog.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Conversion failed. Check the source file and try again.',
        }),
      }),
    );
  });
});

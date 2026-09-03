/** @jest-environment node */

import { GET } from '../route';
import { getSessionConversionPrincipal } from '@/lib/api/conversion-request';
import { getCurrentSession } from '@/lib/auth/session';
import {
  StoredConversionNotFoundError,
  downloadStoredConversion,
} from '@/lib/privacy/conversion-results';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth/session', () => ({ getCurrentSession: jest.fn() }));
jest.mock('@/lib/api/conversion-request', () => ({ getSessionConversionPrincipal: jest.fn() }));
jest.mock('@/lib/privacy/conversion-results', () => ({
  StoredConversionNotFoundError: class StoredConversionNotFoundError extends Error {},
  downloadStoredConversion: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({ prisma: { conversionLog: { findFirst: jest.fn() } } }));

const mockedGetCurrentSession = jest.mocked(getCurrentSession);
const mockedGetSessionPrincipal = jest.mocked(getSessionConversionPrincipal);
const mockedDownloadStoredConversion = jest.mocked(downloadStoredConversion);
const mockedPrisma = jest.mocked(prisma, { shallow: false });
const context = { params: Promise.resolve({ conversionId: 'conversion-1' }) };

describe('GET /api/account/conversions/:conversionId/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentSession.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockedGetSessionPrincipal.mockResolvedValue({
      userId: 'user-1',
      storeConversions: true,
      plan: 'FREE',
    });
  });

  it('requires an authenticated active user', async () => {
    mockedGetCurrentSession.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost'), context);

    expect(response.status).toBe(401);
    expect(mockedDownloadStoredConversion).not.toHaveBeenCalled();
  });

  it("streams only the current user's stored result", async () => {
    mockedDownloadStoredConversion.mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([112, 110, 103]));
          controller.close();
        },
      }),
      fileName: 'image.png',
      mimeType: 'image/png',
    });

    const response = await GET(new Request('http://localhost'), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    await expect(response.text()).resolves.toBe('png');
    expect(mockedDownloadStoredConversion).toHaveBeenCalledWith({
      conversionId: 'conversion-1',
      userId: 'user-1',
    });
  });

  it('returns 409 only while the owned conversion is processing', async () => {
    mockedDownloadStoredConversion.mockRejectedValue(new StoredConversionNotFoundError());
    mockedPrisma.conversionLog.findFirst.mockResolvedValue({ status: 'PROCESSING' } as never);

    const response = await GET(new Request('http://localhost'), context);

    expect(response.status).toBe(409);
  });

  it('returns the safe stored failure message when the background job failed', async () => {
    mockedDownloadStoredConversion.mockRejectedValue(new StoredConversionNotFoundError());
    mockedPrisma.conversionLog.findFirst.mockResolvedValue({
      status: 'FAILED',
      errorMessage: 'Conversion failed. Check the source file and try again.',
    } as never);

    const response = await GET(new Request('http://localhost'), context);

    expect(response.status).toBe(422);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      error: 'Conversion failed. Check the source file and try again.',
    });
  });
});

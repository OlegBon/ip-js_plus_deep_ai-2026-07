/** @jest-environment node */

import { POST } from '../route';
import { getCurrentSession } from '@/lib/auth/session';
import {
  createConversionRequest,
  getSessionConversionPrincipal,
  validateConversionRequest,
} from '@/lib/api/conversion-request';
import { validateCoreConversion } from '@/lib/core/conversion';
import { processConversionJob } from '@/lib/core/conversion-job';
import { after } from 'next/server';

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return { ...actual, after: jest.fn() };
});
jest.mock('@/lib/auth/session', () => ({ getCurrentSession: jest.fn() }));
jest.mock('@/lib/api/conversion-request', () => ({
  createConversionRequest: jest.fn(),
  getSessionConversionPrincipal: jest.fn(),
  isMultipartFormData: (contentType: string | null) =>
    contentType?.startsWith('multipart/form-data') ?? false,
  validateConversionRequest: jest.fn(() => ({ targetFormat: 'png' })),
  ConversionQuotaExceededError: class ConversionQuotaExceededError extends Error {},
}));
jest.mock('@/lib/core/conversion', () => ({
  CoreConversionError: class CoreConversionError extends Error {},
  validateCoreConversion: jest.fn(),
}));
jest.mock('@/lib/core/conversion-job', () => ({ processConversionJob: jest.fn() }));

const mockedGetCurrentSession = jest.mocked(getCurrentSession);
const mockedGetSessionPrincipal = jest.mocked(getSessionConversionPrincipal);
const mockedCreateConversionRequest = jest.mocked(createConversionRequest);
const mockedValidateConversionRequest = jest.mocked(validateConversionRequest);
const mockedValidateCoreConversion = jest.mocked(validateCoreConversion);
const mockedProcessConversionJob = jest.mocked(processConversionJob);
const mockedAfter = jest.mocked(after);

function formRequest() {
  const formData = new FormData();
  formData.set('file', new Blob(['image'], { type: 'image/png' }), 'image.png');
  formData.set('targetFormat', 'png');
  return new Request('http://localhost/api/account/conversions', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/account/conversions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentSession.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockedGetSessionPrincipal.mockResolvedValue({
      userId: 'user-1',
      storeConversions: true,
      plan: 'FREE',
    });
    mockedValidateConversionRequest.mockReturnValue({ targetFormat: 'png' });
    mockedCreateConversionRequest.mockResolvedValue({
      conversion: {
        id: 'conversion-1',
        status: 'PENDING',
        createdAt: new Date('2026-08-25T12:00:00.000Z'),
      },
    });
  });

  it('requires an authenticated active user', async () => {
    mockedGetCurrentSession.mockResolvedValue(null);

    const response = await POST(formRequest());

    expect(response.status).toBe(401);
    expect(mockedGetSessionPrincipal).not.toHaveBeenCalled();
  });

  it('queues a stored conversion without exposing an API key', async () => {
    const response = await POST(formRequest());

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      conversionId: 'conversion-1',
      status: 'PENDING',
      createdAt: '2026-08-25T12:00:00.000Z',
    });
    expect(mockedCreateConversionRequest).toHaveBeenCalledWith(
      { userId: 'user-1', storeConversions: true, plan: 'FREE' },
      expect.objectContaining({
        targetFormat: 'png',
        sourceFileHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        reuseStoredResult: true,
      }),
    );
    expect(mockedValidateCoreConversion).toHaveBeenCalled();
    expect(mockedAfter).toHaveBeenCalledWith(expect.any(Function));
  });

  it('returns an active matching conversion instead of creating another job', async () => {
    mockedCreateConversionRequest.mockResolvedValue({
      existingConversion: { id: 'existing-conversion' },
    } as never);

    const response = await POST(formRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'AVAILABLE',
      conversionId: 'existing-conversion',
    });
    expect(mockedAfter).not.toHaveBeenCalled();
  });

  it('streams the result when the user has disabled result storage', async () => {
    mockedGetSessionPrincipal.mockResolvedValue({
      userId: 'user-1',
      storeConversions: false,
      plan: 'BASIC',
    });
    mockedProcessConversionJob.mockResolvedValue({
      data: Buffer.from('jpg'),
      fileName: 'image.jpg',
      mimeType: 'image/jpeg',
    });

    const response = await POST(formRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.text()).resolves.toBe('jpg');
    expect(mockedProcessConversionJob).toHaveBeenCalledWith(
      expect.objectContaining({ storeResult: false }),
    );
  });
});

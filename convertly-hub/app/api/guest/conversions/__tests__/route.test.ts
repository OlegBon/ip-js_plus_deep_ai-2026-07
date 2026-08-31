import { GET } from '../route';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { headers?: Record<string, string> }) => ({
      json: async () => body,
      headers: { get: (name: string) => init?.headers?.[name] ?? null },
    }),
  },
}));
jest.mock('@/lib/prisma', () => ({
  prisma: { guestConversionQuota: { findUnique: jest.fn() } },
}));

const mockedCookies = jest.mocked(cookies);
const mockedPrisma = jest.mocked(prisma, { shallow: false });

describe('GET /api/guest/conversions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a full guest allowance when the visitor has no cookie', async () => {
    mockedCookies.mockResolvedValue({ get: () => undefined } as never);

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      remainingImage: 3,
      remainingDocument: 2,
      resetsAt: expect.any(String),
    });
    expect(mockedPrisma.guestConversionQuota.findUnique).not.toHaveBeenCalled();
  });

  it('hydrates the remaining allowance from the current visitor quota', async () => {
    mockedCookies.mockResolvedValue({ get: () => ({ value: 'visitor-token' }) } as never);
    mockedPrisma.guestConversionQuota.findUnique.mockResolvedValue({
      imageCount: 2,
      documentCount: 1,
    } as never);

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      remainingImage: 1,
      remainingDocument: 1,
      resetsAt: expect.any(String),
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

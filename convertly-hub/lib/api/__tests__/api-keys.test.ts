import {
  createApiKey,
  hashApiKey,
  listApiKeys,
  normalizeApiKeyName,
  revokeApiKey,
} from '../api-keys';
import { prisma } from '@/lib/prisma';
import { getActivePlanForUser } from '@/lib/billing/subscriptions';

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({ update: jest.fn(() => ({ digest: jest.fn(() => 'key-hash') })) })),
  randomBytes: jest.fn(() => Buffer.alloc(32, 7)),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    apiKey: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  },
}));
jest.mock('@/lib/billing/subscriptions', () => ({ getActivePlanForUser: jest.fn() }));

const mockedPrisma = jest.mocked(prisma, { shallow: false });
const mockedGetActivePlanForUser = jest.mocked(getActivePlanForUser);

describe('API key service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.user.findUnique.mockResolvedValue({ status: 'ACTIVE' } as never);
    mockedGetActivePlanForUser.mockResolvedValue('BASIC');
  });

  it('generates a secret once but stores only its SHA-256 hash', async () => {
    mockedPrisma.apiKey.create.mockResolvedValue({
      id: 'key-1',
      name: 'CLI',
      keyPrefix: 'ch_live_BwcHBw==',
      createdAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
    } as never);

    const result = await createApiKey('user-1', 'CLI');

    expect(result.secret).toMatch(/^ch_live_/);
    expect(mockedPrisma.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', name: 'CLI', keyHash: 'key-hash' }),
      }),
    );
    expect(result.apiKey).not.toHaveProperty('keyHash');
  });

  it('revokes only an active key owned by the session user', async () => {
    mockedPrisma.apiKey.updateMany.mockResolvedValue({ count: 1 } as never);

    await expect(revokeApiKey('user-1', 'key-1')).resolves.toBe(true);
    expect(mockedPrisma.apiKey.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'key-1', userId: 'user-1', revokedAt: null } }),
    );
  });

  it('lists only active keys for the dashboard', async () => {
    mockedPrisma.apiKey.findMany.mockResolvedValue([] as never);

    await listApiKeys('user-1');

    expect(mockedPrisma.apiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }),
    );
  });

  it('normalizes the optional display name without accepting blank or oversized values', () => {
    expect(normalizeApiKeyName(undefined)).toBe('Default');
    expect(normalizeApiKeyName('  CLI key ')).toBe('CLI key');
    expect(normalizeApiKeyName(' ')).toBeNull();
    expect(normalizeApiKeyName('x'.repeat(65))).toBeNull();
    expect(hashApiKey('secret')).toBe('key-hash');
  });
});

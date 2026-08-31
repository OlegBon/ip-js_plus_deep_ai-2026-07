import {
  listAdminUsers,
  parseAdminUserSearch,
  revokeAdminApiKey,
  updateAdminUserStatus,
} from '../user-management';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
    apiKey: { updateMany: jest.fn() },
  },
}));

const mockedPrisma = jest.mocked(prisma, { shallow: false });

describe('admin user management service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' } as never);
  });

  it('returns a cursor-paginated, secret-free user page', async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      { id: 'user-3', email: 'third@example.com' },
      { id: 'user-2', email: 'second@example.com' },
      { id: 'user-1', email: 'first@example.com' },
    ] as never);
    mockedPrisma.user.count.mockResolvedValue(3);

    const result = await listAdminUsers('admin-1', {
      limit: 2,
      query: 'example',
      cursor: undefined,
      sort: 'createdAt',
      direction: 'desc',
    });

    expect(result).toEqual({
      users: [
        { id: 'user-3', email: 'third@example.com' },
        { id: 'user-2', email: 'second@example.com' },
      ],
      nextCursor: 'user-2',
      total: 3,
    });
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
    );
  });

  it('does not let an administrator suspend their own account', async () => {
    await expect(updateAdminUserStatus('admin-1', 'admin-1', 'SUSPENDED')).resolves.toBe(
      'SELF_UPDATE_FORBIDDEN',
    );
    expect(mockedPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('updates a user status and revokes any active key atomically', async () => {
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedPrisma.apiKey.updateMany.mockResolvedValue({ count: 1 } as never);

    await expect(updateAdminUserStatus('admin-1', 'user-1', 'SUSPENDED')).resolves.toBe('UPDATED');
    await expect(revokeAdminApiKey('admin-1', 'key-1')).resolves.toBe(true);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: 'SUSPENDED' },
    });
    expect(mockedPrisma.apiKey.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'key-1', revokedAt: null } }),
    );
  });

  it('normalizes list bounds and search input', () => {
    const params = new URLSearchParams({ limit: '1000', query: `  ${'a'.repeat(120)}  ` });
    expect(parseAdminUserSearch(params)).toEqual({
      limit: 50,
      query: 'a'.repeat(100),
      cursor: undefined,
      sort: 'createdAt',
      direction: 'desc',
    });
  });

  it('accepts only supported sorting fields and directions', () => {
    expect(
      parseAdminUserSearch(new URLSearchParams({ sort: 'email', direction: 'asc' })),
    ).toMatchObject({ sort: 'email', direction: 'asc' });
    expect(
      parseAdminUserSearch(new URLSearchParams({ sort: 'unknown', direction: 'sideways' })),
    ).toMatchObject({ sort: 'createdAt', direction: 'desc' });
  });
});

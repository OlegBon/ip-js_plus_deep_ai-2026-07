/** @jest-environment node */

import { GET } from '../route';
import { getCurrentSession } from '@/lib/auth/session';
import { listAdminUsers } from '@/lib/admin/user-management';

jest.mock('@/lib/auth/session', () => ({ getCurrentSession: jest.fn() }));
jest.mock('@/lib/admin/user-management', () => ({
  AdminAccessDeniedError: class AdminAccessDeniedError extends Error {},
  listAdminUsers: jest.fn(),
  parseAdminUserSearch: jest.requireActual('@/lib/admin/user-management').parseAdminUserSearch,
}));

const mockedSession = jest.mocked(getCurrentSession);
const mockedListAdminUsers = jest.mocked(listAdminUsers);

describe('GET /api/admin/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires a server session', async () => {
    mockedSession.mockResolvedValue(null);
    expect((await GET(new Request('http://localhost/api/admin/users'))).status).toBe(401);
  });

  it('returns a no-store cursor page for an admin session', async () => {
    mockedSession.mockResolvedValue({ user: { id: 'admin-1' } } as never);
    mockedListAdminUsers.mockResolvedValue({ users: [], nextCursor: null, total: 0 });

    const response = await GET(new Request('http://localhost/api/admin/users?query=anna&limit=10'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mockedListAdminUsers).toHaveBeenCalledWith(
      'admin-1',
      expect.objectContaining({ query: 'anna', limit: 10 }),
    );
  });
});

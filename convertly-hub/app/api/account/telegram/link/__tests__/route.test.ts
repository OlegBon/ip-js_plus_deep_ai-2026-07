/** @jest-environment node */

import { DELETE } from '../route';
import { getCurrentSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth/session', () => ({ getCurrentSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { updateMany: jest.fn() } } }));

const session = jest.mocked(getCurrentSession);
const db = jest.mocked(prisma, { shallow: false });

describe('DELETE /api/account/telegram/link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    session.mockResolvedValue({ user: { id: 'user-1' } } as never);
  });

  it('clears Telegram state only for the active session user', async () => {
    db.user.updateMany.mockResolvedValue({ count: 1 } as never);

    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ disconnected: true });
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', status: 'ACTIVE' },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramVerified: null,
        telegramVerificationTokenHash: null,
        telegramVerificationExpires: null,
      },
    });
  });

  it('requires an authenticated session', async () => {
    session.mockResolvedValue(null);

    const response = await DELETE();

    expect(response.status).toBe(401);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it('does not disclose inactive or missing accounts', async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 } as never);

    const response = await DELETE();

    expect(response.status).toBe(401);
  });
});

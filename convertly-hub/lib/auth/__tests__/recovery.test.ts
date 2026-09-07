import { prisma } from '@/lib/prisma';
import {
  createPasswordReset,
  createTelegramPasswordReset,
  resetPassword,
  verifyEmail,
} from '../recovery';

jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() } },
}));
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('new-password-hash') }));

const mockedPrisma = jest.mocked(prisma, { shallow: false });

describe('account recovery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores only a hash and expiry for a password reset', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'person@example.com',
    } as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);
    const result = await createPasswordReset(' Person@example.com ');
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        passwordResetTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        passwordResetExpires: expect.any(Date),
      }),
    });
  });

  it('creates a reset only for an active account with a verified Telegram chat', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      telegramId: '123456',
      telegramVerified: new Date(),
      status: 'ACTIVE',
    } as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);
    const result = await createTelegramPasswordReset('@Convertly_User');
    expect(result?.chatId).toBe('123456');
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { telegramUsername: 'convertly_user' },
      select: expect.any(Object),
    });
  });

  it('does not create a Telegram reset for an unverified or suspended account', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      telegramId: '123456',
      telegramVerified: null,
      status: 'SUSPENDED',
    } as never);
    await expect(createTelegramPasswordReset('convertly_user')).resolves.toBeNull();
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it('changes a password once and removes the reset token', async () => {
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 } as never);
    await expect(resetPassword('token', 'a-secure-password')).resolves.toBe(true);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ passwordResetExpires: { gt: expect.any(Date) } }),
      data: expect.objectContaining({
        password: 'new-password-hash',
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      }),
    });
  });

  it('verifies an unexpired email token once and clears it', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      pendingEmail: null,
      emailVerificationExpires: new Date(Date.now() + 60_000),
    } as never);
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 } as never);
    await expect(verifyEmail('verification-token')).resolves.toBe(true);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ emailVerificationExpires: { gt: expect.any(Date) } }),
      data: expect.objectContaining({
        emailVerified: expect.any(Date),
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      }),
    });
  });
});

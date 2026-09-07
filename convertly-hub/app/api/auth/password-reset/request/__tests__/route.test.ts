/** @jest-environment node */

import { POST } from '../route';
import { createPasswordReset, createTelegramPasswordReset } from '@/lib/auth/recovery';
import { sendPasswordResetEmail } from '@/lib/mail/send-auth-email';
import { sendTelegramPasswordReset } from '@/lib/telegram/bot';
import { clearPasswordResetRateLimit } from '@/lib/auth/password-reset-rate-limit';

jest.mock('@/lib/auth/recovery', () => ({
  createPasswordReset: jest.fn(),
  createTelegramPasswordReset: jest.fn(),
}));
jest.mock('@/lib/mail/send-auth-email', () => ({
  sendPasswordResetEmail: jest.fn(),
  passwordResetUrl: jest.fn((token: string) => `https://convertly.test/password-reset/${token}`),
}));
jest.mock('@/lib/telegram/bot', () => ({ sendTelegramPasswordReset: jest.fn() }));

const mockedCreateReset = jest.mocked(createPasswordReset);
const mockedSendEmail = jest.mocked(sendPasswordResetEmail);
const mockedCreateTelegramReset = jest.mocked(createTelegramPasswordReset);
const mockedSendTelegramReset = jest.mocked(sendTelegramPasswordReset);

describe('POST /api/auth/password-reset/request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPasswordResetRateLimit();
  });

  it('returns the same neutral result when no user has that email', async () => {
    mockedCreateReset.mockResolvedValue(null);
    const response = await POST(
      new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'missing@example.com' }),
      }),
    );
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      message:
        'If an account with that contact method exists, a password reset link has been sent.',
    });
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('sends a reset link without exposing a token in the response', async () => {
    mockedCreateReset.mockResolvedValue({
      email: 'person@example.com',
      token: 'secret-token',
      expiresAt: new Date(),
    });
    const response = await POST(
      new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'person@example.com' }),
      }),
    );
    expect(response.status).toBe(202);
    expect(mockedSendEmail).toHaveBeenCalledWith('person@example.com', 'secret-token');
    await expect(response.text()).resolves.not.toContain('secret-token');
  });

  it('sends a reset link only to the confirmed Telegram chat for a valid handle', async () => {
    mockedCreateTelegramReset.mockResolvedValue({
      chatId: '123456',
      token: 'telegram-secret',
      expiresAt: new Date(),
    });
    const response = await POST(
      new Request('http://localhost/api/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ contact: '@Convertly_User' }),
      }),
    );
    expect(response.status).toBe(202);
    expect(mockedSendTelegramReset).toHaveBeenCalledWith(
      '123456',
      expect.stringContaining('telegram-secret'),
    );
    await expect(response.text()).resolves.not.toContain('telegram-secret');
  });
});

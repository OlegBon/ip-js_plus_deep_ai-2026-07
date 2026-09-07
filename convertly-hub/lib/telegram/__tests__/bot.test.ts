import { sendTelegramPasswordReset } from '../bot';

describe('Telegram Bot API', () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-secret-token';
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterAll(() => {
    if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  it('sends the reset URL only in the Telegram message body', async () => {
    await sendTelegramPasswordReset(
      '123456',
      'https://convertly.test/password-reset/one-time-token',
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-secret-token/sendMessage',
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('one-time-token') }),
    );
  });

  it('rejects a failed Bot API response without including secret details', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(
      sendTelegramPasswordReset('123456', 'https://convertly.test/password-reset/token'),
    ).rejects.toThrow('Telegram Bot API rejected the password reset message.');
  });
});

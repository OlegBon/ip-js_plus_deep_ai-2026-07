import { convertlyBotLinks, sendTelegramBotMessage, sendTelegramPasswordReset } from '../bot';

describe('Telegram Bot API', () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalAppUrl = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-secret-token';
    process.env.NEXTAUTH_URL = 'https://convertly.example/';
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterAll(() => {
    if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = originalToken;
    if (originalAppUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalAppUrl;
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

  it('sends a public bot message with only allowlisted application links', async () => {
    await sendTelegramBotMessage('123456', 'Welcome', convertlyBotLinks());

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body) as {
      reply_markup: { inline_keyboard: Array<Array<{ url: string }>> };
    };
    expect(body.reply_markup.inline_keyboard.flat().map((button) => button.url)).toEqual([
      'https://convertly.example',
      'https://convertly.example/docs',
    ]);
  });
});

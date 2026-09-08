/** @jest-environment node */

import { POST } from '../route';
import { isValidWebhookSecret, verifyTelegramLink } from '@/lib/telegram/linking';
import { convertlyBotLinks, sendTelegramBotMessage } from '@/lib/telegram/bot';

jest.mock('@/lib/telegram/linking', () => ({
  isValidWebhookSecret: jest.fn(),
  verifyTelegramLink: jest.fn(),
}));
jest.mock('@/lib/telegram/bot', () => ({
  convertlyBotLinks: jest.fn(),
  sendTelegramBotMessage: jest.fn(),
}));

const mockedSecretCheck = jest.mocked(isValidWebhookSecret);
const mockedVerifyLink = jest.mocked(verifyTelegramLink);
const mockedBotLinks = jest.mocked(convertlyBotLinks);
const mockedSendMessage = jest.mocked(sendTelegramBotMessage);

describe('POST /api/telegram/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBotLinks.mockReturnValue({ inline_keyboard: [] });
  });

  it('rejects a request without the Telegram webhook secret', async () => {
    mockedSecretCheck.mockReturnValue(false);

    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', { method: 'POST' }),
    );

    expect(response.status).toBe(401);
  });

  it('passes a valid start token to the linking service', async () => {
    mockedSecretCheck.mockReturnValue(true);
    mockedVerifyLink.mockResolvedValue(true);

    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            chat: { id: 123456, type: 'private' },
            from: { username: 'Convertly_User' },
            text: '/start link_abcdefghijklmnopqrst',
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedVerifyLink).toHaveBeenCalledWith(
      '123456',
      'abcdefghijklmnopqrst',
      'Convertly_User',
    );
    expect(mockedSendMessage).toHaveBeenCalledWith(
      '123456',
      'Telegram is connected to your Convertly Hub account. You can return to the app.',
      { inline_keyboard: [] },
    );
  });

  it('ignores a valid link token received in a group chat', async () => {
    mockedSecretCheck.mockReturnValue(true);

    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            chat: { id: -100123, type: 'supergroup' },
            from: { username: 'Convertly_User' },
            text: '/start link_abcdefghijklmnopqrst',
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedVerifyLink).not.toHaveBeenCalled();
    expect(mockedSendMessage).not.toHaveBeenCalled();
  });

  it('welcomes a private-chat user who starts the bot without a link', async () => {
    mockedSecretCheck.mockReturnValue(true);

    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        body: JSON.stringify({
          message: { chat: { id: 123456, type: 'private' }, text: '/start' },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedSendMessage).toHaveBeenCalledWith(
      '123456',
      expect.stringContaining('Welcome to Convertly Hub.'),
      { inline_keyboard: [] },
    );
  });

  it('explains the flow for help and gives a neutral response to unknown private messages', async () => {
    mockedSecretCheck.mockReturnValue(true);

    await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        body: JSON.stringify({ message: { chat: { id: 123456, type: 'private' }, text: '/help' } }),
      }),
    );
    await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        body: JSON.stringify({
          message: { chat: { id: 123456, type: 'private' }, text: 'my email is ada@example.com' },
        }),
      }),
    );

    expect(mockedSendMessage).toHaveBeenNthCalledWith(
      1,
      '123456',
      expect.stringContaining('Sign in to Convertly Hub.'),
      { inline_keyboard: [] },
    );
    expect(mockedSendMessage).toHaveBeenNthCalledWith(
      2,
      '123456',
      expect.stringContaining('supports secure Telegram linking'),
      { inline_keyboard: [] },
    );
  });

  it('responds generically when a link token is invalid', async () => {
    mockedSecretCheck.mockReturnValue(true);
    mockedVerifyLink.mockResolvedValue(false);

    await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        body: JSON.stringify({
          message: { chat: { id: 123456, type: 'private' }, text: '/start link_invalid' },
        }),
      }),
    );

    expect(mockedSendMessage).toHaveBeenCalledWith(
      '123456',
      'This link has expired or was already used. Create a new link in My Account.',
      { inline_keyboard: [] },
    );
  });
});

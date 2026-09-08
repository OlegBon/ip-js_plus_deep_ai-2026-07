import { NextResponse } from 'next/server';
import { isValidWebhookSecret, verifyTelegramLink } from '@/lib/telegram/linking';
import { convertlyBotLinks, sendTelegramBotMessage } from '@/lib/telegram/bot';

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string; type?: string };
    from?: { username?: string };
    text?: string;
  };
};

export async function POST(request: Request) {
  if (!isValidWebhookSecret(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
  }

  const token = parseLinkToken(update.message?.text);
  const chatId = update.message?.chat?.id;

  if (
    update.message?.chat?.type !== 'private' ||
    (typeof chatId !== 'number' && typeof chatId !== 'string')
  ) {
    return NextResponse.json({ ok: true });
  }

  const normalizedChatId = String(chatId);
  if (token) {
    const linked = await verifyTelegramLink(
      normalizedChatId,
      token,
      update.message?.from?.username,
    );
    await sendTelegramBotMessage(
      normalizedChatId,
      linked
        ? 'Telegram is connected to your Convertly Hub account. You can return to the app.'
        : 'This link has expired or was already used. Create a new link in My Account.',
      convertlyBotLinks(),
    );
    return NextResponse.json({ ok: true });
  }

  if (isStartCommand(update.message?.text)) {
    await sendTelegramBotMessage(
      normalizedChatId,
      'Welcome to Convertly Hub. Use a secure one-time link from My Account to connect Telegram. After linking, you can request a password reset through your linked @username.\n\nFor your privacy, this bot does not accept files, passwords, or account details.',
      convertlyBotLinks(),
    );
  } else if (isHelpCommand(update.message?.text)) {
    await sendTelegramBotMessage(
      normalizedChatId,
      '1. Sign in to Convertly Hub.\n2. Open My Account.\n3. Select Connect Telegram.\n4. Open the one-time link here.\n\nTelegram is used only for account linking and password recovery.',
      convertlyBotLinks(),
    );
  } else {
    await sendTelegramBotMessage(
      normalizedChatId,
      'This bot supports secure Telegram linking for Convertly Hub. Manage your account in the app.',
      convertlyBotLinks(),
    );
  }

  return NextResponse.json({ ok: true });
}

function parseLinkToken(text: string | undefined) {
  const match = text?.match(/^\/start(?:@\w+)?\s+link_([A-Za-z0-9_-]+)$/);
  return match?.[1];
}

function isStartCommand(text: string | undefined) {
  return /^\/start(?:@\w+)?\s*$/.test(text ?? '');
}

function isHelpCommand(text: string | undefined) {
  return /^\/help(?:@\w+)?\s*$/.test(text ?? '');
}

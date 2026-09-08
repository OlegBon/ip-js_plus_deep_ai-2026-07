const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
const BOT_REQUEST_TIMEOUT_MS = 10_000;

type InlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; url: string }>>;
};

function botToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error('Telegram bot token is not configured.');
  return token;
}

function appUrl() {
  return (process.env.NEXTAUTH_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

export function convertlyBotLinks(): InlineKeyboard {
  const origin = appUrl();
  return {
    inline_keyboard: [
      [{ text: 'Open Convertly Hub', url: origin }],
      [{ text: 'How to connect', url: `${origin}/docs` }],
    ],
  };
}

export async function sendTelegramBotMessage(
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboard,
) {
  await sendMessage(chatId, { text, reply_markup: replyMarkup });
}

export async function sendTelegramPasswordReset(chatId: string, resetUrl: string) {
  await sendMessage(chatId, {
    text: `Open this one-time Convertly Hub password reset link within 30 minutes:\n${resetUrl}`,
    disable_web_page_preview: true,
  });
}

async function sendMessage(
  chatId: string,
  body: { text: string; disable_web_page_preview?: boolean; reply_markup?: InlineKeyboard },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BOT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${TELEGRAM_API_BASE_URL}/bot${botToken()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        ...body,
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error('Telegram Bot API rejected the password reset message.');
  } finally {
    clearTimeout(timeout);
  }
}

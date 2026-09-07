const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
const BOT_REQUEST_TIMEOUT_MS = 10_000;

function botToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error('Telegram bot token is not configured.');
  return token;
}

export async function sendTelegramPasswordReset(chatId: string, resetUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BOT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${TELEGRAM_API_BASE_URL}/bot${botToken()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Open this one-time Convertly Hub password reset link within 30 minutes:\n${resetUrl}`,
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error('Telegram Bot API rejected the password reset message.');
  } finally {
    clearTimeout(timeout);
  }
}

import { NextResponse } from 'next/server';
import { createPasswordReset, createTelegramPasswordReset } from '@/lib/auth/recovery';
import { canRequestPasswordReset } from '@/lib/auth/password-reset-rate-limit';
import { sendPasswordResetEmail } from '@/lib/mail/send-auth-email';
import { passwordResetUrl } from '@/lib/mail/send-auth-email';
import { sendTelegramPasswordReset } from '@/lib/telegram/bot';

const NEUTRAL_RESPONSE = {
  message: 'If an account with that contact method exists, a password reset link has been sent.',
};

export async function POST(request: Request) {
  const contact = await readContact(request);

  if (!contact) {
    return NextResponse.json(
      { error: 'Enter a valid email address or Telegram handle.' },
      { status: 400 },
    );
  }

  if (!canRequestPasswordReset(contact.value)) {
    return NextResponse.json(NEUTRAL_RESPONSE, { status: 202 });
  }

  try {
    if (contact.kind === 'email') {
      const reset = await createPasswordReset(contact.value);
      if (reset) await sendPasswordResetEmail(reset.email, reset.token);
    } else {
      const reset = await createTelegramPasswordReset(contact.value);
      if (reset) await sendTelegramPasswordReset(reset.chatId, passwordResetUrl(reset.token));
    }
  } catch {
    // Return the same response to avoid exposing account existence or mail transport state.
  }

  return NextResponse.json(NEUTRAL_RESPONSE, { status: 202 });
}

async function readContact(
  request: Request,
): Promise<{ kind: 'email' | 'telegram'; value: string } | null> {
  try {
    const body: unknown = await request.json();
    const contact =
      typeof body === 'object' && body !== null && 'contact' in body
        ? body.contact
        : typeof body === 'object' && body !== null && 'email' in body
          ? body.email
          : null;
    const normalized = typeof contact === 'string' ? contact.trim().toLowerCase() : '';
    if (normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { kind: 'email', value: normalized };
    }
    if (/^@[a-z0-9_]{5,32}$/.test(normalized)) {
      return { kind: 'telegram', value: normalized.slice(1) };
    }
    return null;
  } catch {
    return null;
  }
}

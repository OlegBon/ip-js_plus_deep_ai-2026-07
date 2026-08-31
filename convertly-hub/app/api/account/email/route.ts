import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { requestEmailChange } from '@/lib/auth/account-security';
import { sendEmailVerification } from '@/lib/mail/send-auth-email';

export async function POST(request: Request) {
  const userId = (await getCurrentSession())?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let body: { email?: unknown; currentPassword?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const result = await requestEmailChange(
    userId,
    typeof body.email === 'string' ? body.email : '',
    typeof body.currentPassword === 'string' ? body.currentPassword : '',
  );
  if ('error' in result) {
    const error = result.error ?? 'INVALID_INPUT';
    return NextResponse.json(
      { error: messageFor(error) },
      { status: error === 'EMAIL_TAKEN' ? 409 : 400 },
    );
  }
  try {
    await sendEmailVerification(result.email, result.token);
  } catch {
    return NextResponse.json(
      {
        error:
          'Email change is pending, but the verification email could not be sent. Use Confirm email to retry.',
      },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { message: 'Check the new email address to confirm the change.' },
    { status: 202 },
  );
}
function messageFor(
  error: 'INVALID_INPUT' | 'CURRENT_PASSWORD_INCORRECT' | 'SAME_EMAIL' | 'EMAIL_TAKEN',
) {
  return {
    INVALID_INPUT: 'Enter a valid email address and your current password.',
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect.',
    SAME_EMAIL: 'This is already your current email address.',
    EMAIL_TAKEN: 'This email address is already in use.',
  }[error];
}

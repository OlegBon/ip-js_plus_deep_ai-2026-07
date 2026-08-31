import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { changePassword } from '@/lib/auth/account-security';

export async function POST(request: Request) {
  const userId = (await getCurrentSession())?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (password !== body.confirmPassword)
    return NextResponse.json({ error: 'New passwords do not match.' }, { status: 400 });
  const result = await changePassword(userId, currentPassword, password);
  if ('error' in result)
    return NextResponse.json(
      {
        error:
          result.error === 'CURRENT_PASSWORD_INCORRECT'
            ? 'Current password is incorrect.'
            : 'Use a new password of 12 to 128 characters.',
      },
      { status: 400 },
    );
  return NextResponse.json({ message: 'Password updated.' });
}

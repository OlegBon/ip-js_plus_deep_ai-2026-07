import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      pendingEmail: true,
      emailVerified: true,
      telegramId: true,
      telegramVerified: true,
      status: true,
    },
  });
  if (!profile || profile.status !== 'ACTIVE') return unauthorized();

  return NextResponse.json(
    {
      name: profile.name,
      email: profile.email,
      pendingEmail: profile.pendingEmail,
      emailVerified: profile.emailVerified !== null,
      telegramId: profile.telegramId,
      telegramVerified: profile.telegramVerified !== null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const name =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as { name?: unknown }).name
      : undefined;
  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 80) {
    return NextResponse.json({ error: 'Name must contain 1 to 80 characters.' }, { status: 400 });
  }

  const updated = await prisma.user.updateMany({
    where: { id: userId, status: 'ACTIVE' },
    data: { name: name.trim() },
  });
  if (updated.count === 0) return unauthorized();
  return GET();
}

async function getSessionUserId() {
  return (await getCurrentSession())?.user?.id;
}
function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

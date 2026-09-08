import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { createTelegramLink } from '@/lib/telegram/linking';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const link = await createTelegramLink(session.user.id);
    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: 'Unable to start Telegram linking.' }, { status: 503 });
  }
}

export async function DELETE() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await prisma.user.updateMany({
    where: { id: session.user.id, status: 'ACTIVE' },
    data: {
      telegramId: null,
      telegramUsername: null,
      telegramVerified: null,
      telegramVerificationTokenHash: null,
      telegramVerificationExpires: null,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json({ disconnected: true });
}

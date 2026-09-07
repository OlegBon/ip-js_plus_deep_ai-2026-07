import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import {
  AccountDeletionRequestNotFoundError,
  AccountDeletionRequestStateError,
  cancelOwnAccountDeletionRequest,
  getAccountDeletionRequestForUser,
  requestAccountDeletion,
} from '@/lib/account-deletion/workflow';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) return NextResponse.json({ accountDeleted: true }, { status: 410 });
  if (user.status !== 'ACTIVE') return unauthorized();

  const request = await getAccountDeletionRequestForUser(userId);
  return NextResponse.json({ request }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  try {
    await cancelOwnAccountDeletionRequest(userId);
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    if (error instanceof AccountDeletionRequestNotFoundError) {
      return NextResponse.json({ error: 'Deletion request not found.' }, { status: 404 });
    }
    if (error instanceof AccountDeletionRequestStateError) {
      return NextResponse.json(
        { error: 'This deletion request can no longer be cancelled.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Unable to cancel the deletion request.' }, { status: 503 });
  }
}

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  try {
    const result = await requestAccountDeletion(userId);
    return NextResponse.json(result, { status: result.alreadyRequested ? 200 : 202 });
  } catch (error) {
    if (error instanceof AccountDeletionRequestNotFoundError) return unauthorized();
    return NextResponse.json({ error: 'Unable to create the deletion request.' }, { status: 503 });
  }
}

async function getSessionUserId() {
  return (await getCurrentSession())?.user?.id;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

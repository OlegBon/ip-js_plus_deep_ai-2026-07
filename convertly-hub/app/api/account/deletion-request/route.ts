import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import {
  AccountDeletionRequestNotFoundError,
  getAccountDeletionRequestForUser,
  requestAccountDeletion,
} from '@/lib/account-deletion/workflow';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const request = await getAccountDeletionRequestForUser(userId);
  return NextResponse.json({ request }, { headers: { 'Cache-Control': 'no-store' } });
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

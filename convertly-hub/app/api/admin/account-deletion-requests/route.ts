import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { AdminAccessDeniedError } from '@/lib/admin/user-management';
import { listAccountDeletionRequests } from '@/lib/account-deletion/workflow';

export const runtime = 'nodejs';

export async function GET() {
  const actorUserId = (await getCurrentSession())?.user?.id;
  if (!actorUserId) return unauthorized();

  try {
    const requests = await listAccountDeletionRequests(actorUserId);
    return NextResponse.json({ requests }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    return NextResponse.json({ error: 'Unable to list deletion requests.' }, { status: 503 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { AdminAccessDeniedError } from '@/lib/admin/user-management';
import {
  AccountDeletionRequestNotFoundError,
  AccountDeletionRequestStateError,
  cancelAccountDeletionRequest,
  listAccountDeletionRequests,
  parseAccountDeletionRequestSearch,
} from '@/lib/account-deletion/workflow';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const actorUserId = (await getCurrentSession())?.user?.id;
  if (!actorUserId) return unauthorized();

  try {
    const result = await listAccountDeletionRequests(
      actorUserId,
      parseAccountDeletionRequestSearch(new URL(request.url).searchParams),
    );
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    return NextResponse.json({ error: 'Unable to list deletion requests.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const actorUserId = (await getCurrentSession())?.user?.id;
  if (!actorUserId) return unauthorized();
  const requestId = new URL(request.url).searchParams.get('requestId');
  if (!requestId) return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 });

  try {
    const deletionRequest = await cancelAccountDeletionRequest(actorUserId, requestId);
    return NextResponse.json({ request: deletionRequest });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
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

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

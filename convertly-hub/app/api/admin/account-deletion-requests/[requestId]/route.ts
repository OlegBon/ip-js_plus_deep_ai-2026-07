import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { AdminAccessDeniedError } from '@/lib/admin/user-management';
import {
  AccountDeletionRequestNotFoundError,
  AccountDeletionRequestStateError,
  AccountDeletionSelfApprovalError,
  processAccountDeletionRequest,
} from '@/lib/account-deletion/workflow';

export const runtime = 'nodejs';

export async function POST(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  const actorUserId = (await getCurrentSession())?.user?.id;
  if (!actorUserId) return unauthorized();

  const { requestId } = await context.params;
  if (!requestId) return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 });

  try {
    const result = await processAccountDeletionRequest(actorUserId, requestId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    if (error instanceof AccountDeletionRequestNotFoundError) {
      return NextResponse.json({ error: 'Deletion request not found.' }, { status: 404 });
    }
    if (error instanceof AccountDeletionSelfApprovalError) {
      return NextResponse.json(
        { error: 'An administrator cannot delete their own account from the Admin Panel.' },
        { status: 403 },
      );
    }
    if (error instanceof AccountDeletionRequestStateError) {
      return NextResponse.json(
        { error: 'This deletion request cannot be processed now.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Deletion could not be completed. The request can be retried.' },
      { status: 503 },
    );
  }
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

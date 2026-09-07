import { prisma } from '@/lib/prisma';
import { AdminAccessDeniedError } from '@/lib/admin/user-management';
import { getStorageService } from '@/lib/storage/s3';
import {
  sendAccountDeletionCompletedNotification,
  sendAccountDeletionFailedNotification,
  sendAccountDeletionRequestedNotification,
} from '@/lib/mail/send-auth-email';

export class AccountDeletionRequestNotFoundError extends Error {}
export class AccountDeletionRequestStateError extends Error {}
export class AccountDeletionSelfApprovalError extends Error {}

const genericFailureReason =
  'Stored files could not be removed. Retry the request from the Admin Panel.';

export async function requestAccountDeletion(userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') throw new AccountDeletionRequestNotFoundError();

    const existing = await tx.accountDeletionRequest.findUnique({ where: { userId } });
    if (existing && existing.status !== 'FAILED') {
      return { request: existing, alreadyRequested: true };
    }

    const request = existing
      ? await tx.accountDeletionRequest.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            requestedAt: new Date(),
            processingStartedAt: null,
            completedAt: null,
            failureReason: null,
            processedByUserId: null,
            processedByEmail: null,
            events: { create: { type: 'REQUESTED', actorUserId: user.id, actorEmail: user.email } },
          },
        })
      : await tx.accountDeletionRequest.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            events: { create: { type: 'REQUESTED', actorUserId: user.id, actorEmail: user.email } },
          },
        });

    return { request, alreadyRequested: false };
  });

  if (!result.alreadyRequested) {
    await notifyWithoutBlocking('requested', result.request.id, result.request.userEmail);
  }
  return result;
}

export async function getAccountDeletionRequestForUser(userId: string) {
  return prisma.accountDeletionRequest.findUnique({
    where: { userId },
    select: requestSelect,
  });
}

export async function listAccountDeletionRequests(actorUserId: string) {
  await getActiveAdmin(actorUserId);
  return prisma.accountDeletionRequest.findMany({
    select: requestSelect,
    orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
    take: 50,
  });
}

export async function processAccountDeletionRequest(actorUserId: string, requestId: string) {
  const actor = await getActiveAdmin(actorUserId);
  const claim = await prisma.$transaction(async (tx) => {
    const request = await tx.accountDeletionRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true, userEmail: true, status: true },
    });
    if (!request) throw new AccountDeletionRequestNotFoundError();
    if (!request.userId || request.status === 'COMPLETED' || request.status === 'PROCESSING') {
      throw new AccountDeletionRequestStateError();
    }
    if (request.userId === actorUserId) throw new AccountDeletionSelfApprovalError();

    const updated = await tx.accountDeletionRequest.updateMany({
      where: { id: request.id, status: { in: ['PENDING', 'FAILED'] } },
      data: {
        status: 'PROCESSING',
        processingStartedAt: new Date(),
        completedAt: null,
        failureReason: null,
        processedByUserId: actorUserId,
        processedByEmail: actor.email,
      },
    });
    if (!updated.count) throw new AccountDeletionRequestStateError();

    await tx.accountDeletionEvent.create({
      data: { requestId: request.id, type: 'PROCESSING', actorUserId, actorEmail: actor.email },
    });
    return request;
  });

  try {
    const conversions = await prisma.conversionLog.findMany({
      where: { userId: claim.userId!, storageKey: { not: null } },
      select: { storageKey: true },
    });
    const storage = getStorageService();
    for (const conversion of conversions) {
      if (conversion.storageKey) await storage.deleteFile(conversion.storageKey);
    }

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.user.deleteMany({ where: { id: claim.userId! } });
      if (!deleted.count) throw new AccountDeletionRequestStateError();
      await tx.accountDeletionRequest.update({
        where: { id: claim.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          userId: null,
          events: { create: { type: 'COMPLETED', actorUserId, actorEmail: actor.email } },
        },
      });
    });
  } catch (error) {
    await markAccountDeletionFailed(claim.id, actorUserId, actor.email);
    console.error('Account deletion failed.', {
      requestId: claim.id,
      stage:
        error instanceof AccountDeletionRequestStateError
          ? 'database-delete'
          : 'storage-or-database',
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    await notifyWithoutBlocking('failed', claim.id, claim.userEmail);
    throw error;
  }

  await notifyWithoutBlocking('completed', claim.id, claim.userEmail);
  return { id: claim.id, status: 'COMPLETED' as const };
}

async function getActiveAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true, status: true },
  });
  if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE')
    throw new AdminAccessDeniedError();
  return user;
}

async function markAccountDeletionFailed(
  requestId: string,
  actorUserId: string,
  actorEmail: string,
) {
  await prisma.accountDeletionRequest.update({
    where: { id: requestId },
    data: {
      status: 'FAILED',
      failureReason: genericFailureReason,
      events: { create: { type: 'FAILED', actorUserId, actorEmail } },
    },
  });
}

async function notifyWithoutBlocking(
  kind: 'requested' | 'completed' | 'failed',
  requestId: string,
  userEmail: string,
) {
  try {
    if (kind === 'requested') await sendAccountDeletionRequestedNotification(requestId, userEmail);
    else if (kind === 'completed')
      await sendAccountDeletionCompletedNotification(requestId, userEmail);
    else await sendAccountDeletionFailedNotification(requestId, userEmail);
  } catch {
    console.error('Account deletion support notification failed.', { kind, requestId });
  }
}

const requestSelect = {
  id: true,
  userEmail: true,
  status: true,
  requestedAt: true,
  processingStartedAt: true,
  completedAt: true,
  failureReason: true,
  processedByEmail: true,
  events: {
    select: { id: true, type: true, actorEmail: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
} as const;

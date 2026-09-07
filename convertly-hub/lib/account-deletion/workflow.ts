import { prisma } from '@/lib/prisma';
import type { AccountDeletionStatus, Prisma } from '@prisma/client';
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
    if (existing && existing.status !== 'FAILED' && existing.status !== 'CANCELLED') {
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
            cancelledAt: null,
            failureReason: null,
            processedByUserId: null,
            processedByEmail: null,
            cancelledByUserId: null,
            cancelledByEmail: null,
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
    where: { userId, status: { not: 'CANCELLED' } },
    select: requestSelect,
  });
}

const deletionStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;

export function parseAccountDeletionRequestSearch(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get('limit') ?? '10');
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
  const query = (searchParams.get('query') ?? '').trim().slice(0, 100);
  const rawStatus = searchParams.get('status');
  const status = deletionStatuses.includes(rawStatus as AccountDeletionStatus)
    ? (rawStatus as AccountDeletionStatus)
    : undefined;
  return { limit, query, status, cursor: searchParams.get('cursor') || undefined };
}

export async function listAccountDeletionRequests(
  actorUserId: string,
  options: ReturnType<typeof parseAccountDeletionRequestSearch>,
) {
  await getActiveAdmin(actorUserId);
  const where: Prisma.AccountDeletionRequestWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.query ? { userEmail: { contains: options.query, mode: 'insensitive' } } : {}),
  };
  const [requests, total] = await Promise.all([
    prisma.accountDeletionRequest.findMany({
      where,
      select: requestSelect,
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    }),
    prisma.accountDeletionRequest.count({ where }),
  ]);
  const hasNextPage = requests.length > options.limit;
  const page = hasNextPage ? requests.slice(0, options.limit) : requests;
  return { requests: page, nextCursor: hasNextPage ? (page.at(-1)?.id ?? null) : null, total };
}

export async function cancelAccountDeletionRequest(actorUserId: string, requestId: string) {
  const actor = await getActiveAdmin(actorUserId);
  return cancelDeletionRequest(requestId, actorUserId, actor.email);
}

export async function cancelOwnAccountDeletionRequest(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, status: true },
  });
  if (!user || user.status !== 'ACTIVE') throw new AccountDeletionRequestNotFoundError();
  return cancelDeletionRequestForStatuses(userId, userId, user.email, ['PENDING']);
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

async function cancelDeletionRequest(requestId: string, actorUserId: string, actorEmail: string) {
  const request = await prisma.accountDeletionRequest.findUnique({
    where: { id: requestId },
    select: { id: true, userId: true, status: true },
  });
  if (!request) throw new AccountDeletionRequestNotFoundError();
  if (!request.userId) throw new AccountDeletionRequestStateError();
  return cancelDeletionRequestForStatuses(
    request.userId,
    actorUserId,
    actorEmail,
    ['PENDING', 'FAILED'],
    request.id,
  );
}

async function cancelDeletionRequestForStatuses(
  userId: string,
  actorUserId: string,
  actorEmail: string,
  statuses: AccountDeletionStatus[],
  requestId?: string,
) {
  const request = requestId
    ? await prisma.accountDeletionRequest.findUnique({ where: { id: requestId } })
    : await prisma.accountDeletionRequest.findUnique({ where: { userId } });
  if (!request) throw new AccountDeletionRequestNotFoundError();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.accountDeletionRequest.updateMany({
      where: { id: request.id, status: { in: statuses } },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledByUserId: actorUserId,
        cancelledByEmail: actorEmail,
      },
    });
    if (!result.count) throw new AccountDeletionRequestStateError();
    return tx.accountDeletionRequest.update({
      where: { id: request.id },
      data: { events: { create: { type: 'CANCELLED', actorUserId, actorEmail } } },
      select: requestSelect,
    });
  });
  return updated;
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
  cancelledAt: true,
  failureReason: true,
  processedByEmail: true,
  cancelledByEmail: true,
  events: {
    select: { id: true, type: true, actorEmail: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
} as const;

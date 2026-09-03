import { prisma } from '@/lib/prisma';
import { convertFile, type CoreConversionInput } from '@/lib/core/conversion';
import { storeConversionResult } from '@/lib/privacy/conversion-results';
import { getStorageService } from '@/lib/storage/s3';
import { reserveStorageCapacity, StorageQuotaExceededError } from '@/lib/billing/subscriptions';
import { getPlanDefinition } from '@/lib/billing/plans';
import type { SubscriptionPlan } from '@prisma/client';

type ProcessConversionJobInput = CoreConversionInput & {
  conversionId: string;
  storeResult: boolean;
  userId: string;
  plan?: SubscriptionPlan;
};

type ConversionJobStage =
  'conversion' | 'storage-reservation' | 'storage-upload' | 'completion-persist';

export async function processConversionJob({
  conversionId,
  plan = 'FREE',
  ...input
}: ProcessConversionJobInput) {
  const startedAt = new Date();
  const started = await prisma.conversionLog.updateMany({
    where: { id: conversionId, status: 'PENDING' },
    data: { status: 'PROCESSING', startedAt, errorMessage: null },
  });
  if (started.count === 0) return undefined;

  let storageKey: string | undefined;
  let stage: ConversionJobStage = 'conversion';
  try {
    const result = await convertFile(input);
    if (input.storeResult) {
      stage = 'storage-reservation';
      await reserveStorageCapacity(input.userId, plan, conversionId, BigInt(result.data.length));
      stage = 'storage-upload';
      storageKey = await storeConversionResult({
        ...result,
        conversionId,
        userId: input.userId,
      });
    }
    stage = 'completion-persist';
    await prisma.conversionLog.update({
      where: { id: conversionId },
      data: {
        status: 'COMPLETED',
        resultFileName: result.fileName,
        resultMimeType: result.mimeType,
        resultSize: BigInt(result.data.length),
        storageReservationBytes: null,
        storageKey,
        completedAt: new Date(),
        expiresAt: storageKey ? expirationForPlan(plan) : null,
      },
    });
    return result;
  } catch (error) {
    logConversionJobFailure({ conversionId, stage, error });
    if (storageKey) {
      try {
        await getStorageService().deleteFile(storageKey);
      } catch {
        // Preserve the conversion failure even if compensating storage cleanup fails.
      }
    }
    await prisma.conversionLog.updateMany({
      where: { id: conversionId, status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        storageReservationBytes: null,
        errorMessage:
          error instanceof StorageQuotaExceededError
            ? 'Storage limit reached for the active plan.'
            : 'Conversion failed. Check the source file and try again.',
        completedAt: new Date(),
      },
    });
    return undefined;
  }
}

function logConversionJobFailure({
  conversionId,
  stage,
  error,
}: {
  conversionId: string;
  stage: ConversionJobStage;
  error: unknown;
}) {
  const details = error instanceof Error ? error : undefined;
  const metadata =
    details && '$metadata' in details && typeof details.$metadata === 'object' && details.$metadata
      ? (details.$metadata as { httpStatusCode?: unknown; requestId?: unknown })
      : undefined;
  const code =
    details && 'code' in details && typeof details.code === 'string' ? details.code : undefined;

  console.error('Conversion job failed.', {
    conversionId,
    stage,
    errorName: details?.name ?? typeof error,
    code,
    httpStatusCode:
      metadata && typeof metadata.httpStatusCode === 'number' ? metadata.httpStatusCode : undefined,
    requestId: metadata && typeof metadata.requestId === 'string' ? metadata.requestId : undefined,
  });
}

function expirationForPlan(plan: SubscriptionPlan) {
  const retentionDays = getPlanDefinition(plan).retentionDays;
  if (retentionDays === null) return null;
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + retentionDays);
  return expiresAt;
}

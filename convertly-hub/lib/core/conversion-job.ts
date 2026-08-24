import { prisma } from "@/lib/prisma";
import { convertFile, type CoreConversionInput } from "@/lib/core/conversion";
import { storeConversionResult } from "@/lib/privacy/conversion-results";
import { getStorageService } from "@/lib/storage/s3";

type ProcessConversionJobInput = CoreConversionInput & {
  conversionId: string;
  storeResult: boolean;
  userId: string;
};

export async function processConversionJob({ conversionId, ...input }: ProcessConversionJobInput) {
  const startedAt = new Date();
  const started = await prisma.conversionLog.updateMany({
    where: { id: conversionId, status: "PENDING" },
    data: { status: "PROCESSING", startedAt, errorMessage: null },
  });
  if (started.count === 0) return undefined;

  let storageKey: string | undefined;
  try {
    const result = await convertFile(input);
    if (input.storeResult) {
      storageKey = await storeConversionResult({
        ...result,
        conversionId,
        userId: input.userId,
      });
    }
    await prisma.conversionLog.update({
      where: { id: conversionId },
      data: {
        status: "COMPLETED",
        resultFileName: result.fileName,
        resultMimeType: result.mimeType,
        resultSize: BigInt(result.data.length),
        storageKey,
        completedAt: new Date(),
      },
    });
    return result;
  } catch {
    if (storageKey) {
      try {
        await getStorageService().deleteFile(storageKey);
      } catch {
        // Preserve the conversion failure even if compensating storage cleanup fails.
      }
    }
    await prisma.conversionLog.updateMany({
      where: { id: conversionId, status: "PROCESSING" },
      data: {
        status: "FAILED",
        errorMessage: "Conversion failed. Check the source file and try again.",
        completedAt: new Date(),
      },
    });
    return undefined;
  }
}

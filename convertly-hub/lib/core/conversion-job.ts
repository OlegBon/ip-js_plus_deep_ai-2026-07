import { prisma } from "@/lib/prisma";
import { convertFile, type CoreConversionInput } from "@/lib/core/conversion";

type ProcessConversionJobInput = CoreConversionInput & {
  conversionId: string;
};

export async function processConversionJob({ conversionId, ...input }: ProcessConversionJobInput) {
  const startedAt = new Date();
  const started = await prisma.conversionLog.updateMany({
    where: { id: conversionId, status: "PENDING" },
    data: { status: "PROCESSING", startedAt, errorMessage: null },
  });
  if (started.count === 0) return;

  try {
    const result = await convertFile(input);
    await prisma.conversionLog.update({
      where: { id: conversionId },
      data: {
        status: "COMPLETED",
        resultFileName: result.fileName,
        resultMimeType: result.mimeType,
        resultSize: BigInt(result.data.length),
        completedAt: new Date(),
      },
    });
  } catch {
    await prisma.conversionLog.updateMany({
      where: { id: conversionId, status: "PROCESSING" },
      data: {
        status: "FAILED",
        errorMessage: "Conversion failed. Check the source file and try again.",
        completedAt: new Date(),
      },
    });
  }
}

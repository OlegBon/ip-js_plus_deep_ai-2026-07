import { processConversionJob } from "../conversion-job";
import { convertFile } from "../conversion";
import { storeConversionResult } from "@/lib/privacy/conversion-results";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/core/conversion", () => ({ convertFile: jest.fn() }));
jest.mock("@/lib/privacy/conversion-results", () => ({ storeConversionResult: jest.fn() }));
jest.mock("@/lib/storage/s3", () => ({ getStorageService: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: { conversionLog: { updateMany: jest.fn(), update: jest.fn() } },
}));

const mockedConvertFile = jest.mocked(convertFile);
const mockedStoreConversionResult = jest.mocked(storeConversionResult);
const mockedPrisma = jest.mocked(prisma, { shallow: false });
const job = {
  conversionId: "conversion-1",
  data: Buffer.from([0xff, 0xd8, 0xff]),
  sourceFileName: "photo.jpg",
  sourceMimeType: "image/jpeg",
  targetFormat: "png",
  userId: "user-1",
  storeResult: false,
};

describe("conversion job", () => {
  beforeEach(() => jest.clearAllMocks());

  it("marks a pending conversion completed after Core returns a result", async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedConvertFile.mockResolvedValue({
      data: Buffer.from("png"),
      fileName: "photo.png",
      mimeType: "image/png",
    });
    mockedPrisma.conversionLog.update.mockResolvedValue({} as never);

    await processConversionJob(job);

    expect(mockedPrisma.conversionLog.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.objectContaining({ status: "PROCESSING" }) }),
    );
    expect(mockedPrisma.conversionLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          resultFileName: "photo.png",
          resultMimeType: "image/png",
          resultSize: BigInt(3),
        }),
      }),
    );
  });

  it("marks the job failed without exposing a worker error", async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValueOnce({ count: 1 } as never);
    mockedConvertFile.mockRejectedValue(new Error("Gotenberg internals"));

    await processConversionJob(job);

    expect(mockedPrisma.conversionLog.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "Conversion failed. Check the source file and try again.",
        }),
      }),
    );
  });

  it("stores a completed result only when the user enabled storage", async () => {
    mockedPrisma.conversionLog.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedConvertFile.mockResolvedValue({
      data: Buffer.from("png"),
      fileName: "photo.png",
      mimeType: "image/png",
    });
    mockedStoreConversionResult.mockResolvedValue("users/user-1/conversions/conversion-1/photo.png");
    mockedPrisma.conversionLog.update.mockResolvedValue({} as never);

    await processConversionJob({ ...job, storeResult: true });

    expect(mockedStoreConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({ conversionId: "conversion-1", userId: "user-1" }),
    );
    expect(mockedPrisma.conversionLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ storageKey: "users/user-1/conversions/conversion-1/photo.png" }),
      }),
    );
  });
});

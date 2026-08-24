/** @jest-environment node */

import { POST } from "../route";
import { authenticateApiKey, createConversionRequest } from "@/lib/api/conversion-request";
import { validateCoreConversion } from "@/lib/core/conversion";
import { processConversionJob } from "@/lib/core/conversion-job";
import { after } from "next/server";

jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return { ...actual, after: jest.fn() };
});

jest.mock("@/lib/api/conversion-request", () => ({
  authenticateApiKey: jest.fn(),
  createConversionRequest: jest.fn(),
  isMultipartFormData: (contentType: string | null) => contentType?.startsWith("multipart/form-data") ?? false,
}));
jest.mock("@/lib/core/conversion", () => ({
  CoreConversionError: class CoreConversionError extends Error {},
  validateCoreConversion: jest.fn(),
}));
jest.mock("@/lib/core/conversion-job", () => ({ processConversionJob: jest.fn() }));

const mockedAuthenticateApiKey = jest.mocked(authenticateApiKey);
const mockedCreateConversionRequest = jest.mocked(createConversionRequest);
const mockedValidateCoreConversion = jest.mocked(validateCoreConversion);
const mockedProcessConversionJob = jest.mocked(processConversionJob);
const mockedAfter = jest.mocked(after);

describe("POST /api/v1/convert", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 without a valid API key", async () => {
    mockedAuthenticateApiKey.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/v1/convert", { method: "POST" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("requires multipart/form-data", async () => {
    mockedAuthenticateApiKey.mockResolvedValue({ apiKeyId: "key-1", userId: "user-1", storeConversions: true });

    const response = await POST(
      new Request("http://localhost/api/v1/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(415);
    expect(mockedCreateConversionRequest).not.toHaveBeenCalled();
  });

  it("queues a validated conversion with 202", async () => {
    mockedAuthenticateApiKey.mockResolvedValue({ apiKeyId: "key-1", userId: "user-1", storeConversions: true });
    mockedCreateConversionRequest.mockResolvedValue({
      conversion: {
        id: "conversion-1",
        status: "PENDING",
        createdAt: new Date("2026-08-24T12:00:00.000Z"),
      },
    });
    const formData = new FormData();
    formData.append("file", new Blob(["image"], { type: "image/png" }), "image.png");
    formData.append("targetFormat", "png");

    const response = await POST(
      new Request("http://localhost/api/v1/convert", { method: "POST", body: formData }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      conversionId: "conversion-1",
      status: "PENDING",
      createdAt: "2026-08-24T12:00:00.000Z",
    });
    expect(mockedValidateCoreConversion).toHaveBeenCalled();
    expect(mockedProcessConversionJob).not.toHaveBeenCalled();
    expect(mockedAfter).toHaveBeenCalledWith(expect.any(Function));
  });

  it("streams the converted file and skips S3 when storage is disabled", async () => {
    mockedAuthenticateApiKey.mockResolvedValue({ apiKeyId: "key-1", userId: "user-1", storeConversions: false });
    mockedCreateConversionRequest.mockResolvedValue({
      conversion: { id: "conversion-1", status: "PENDING", createdAt: new Date("2026-08-24T12:00:00.000Z") },
    });
    mockedProcessConversionJob.mockResolvedValue({
      data: Buffer.from("png"),
      fileName: "image.png",
      mimeType: "image/png",
    });
    const formData = new FormData();
    formData.append("file", new Blob(["image"], { type: "image/png" }), "image.png");
    formData.append("targetFormat", "png");

    const response = await POST(
      new Request("http://localhost/api/v1/convert", { method: "POST", body: formData }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("png");
    expect(mockedProcessConversionJob).toHaveBeenCalledWith(expect.objectContaining({ storeResult: false }));
    expect(mockedAfter).not.toHaveBeenCalled();
  });
});

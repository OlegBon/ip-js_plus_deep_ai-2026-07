/** @jest-environment node */

import { GET } from "../route";
import { authenticateApiKey } from "@/lib/api/conversion-request";
import {
  downloadStoredConversion,
  StoredConversionNotFoundError,
} from "@/lib/privacy/conversion-results";

jest.mock("@/lib/api/conversion-request", () => ({ authenticateApiKey: jest.fn() }));
jest.mock("@/lib/privacy/conversion-results", () => ({
  downloadStoredConversion: jest.fn(),
  StoredConversionNotFoundError: class StoredConversionNotFoundError extends Error {},
}));

const mockedAuthenticateApiKey = jest.mocked(authenticateApiKey);
const mockedDownloadStoredConversion = jest.mocked(downloadStoredConversion);

describe("GET /api/v1/conversions/:conversionId/download", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires an API key", async () => {
    mockedAuthenticateApiKey.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/v1/conversions/conversion-1/download"), {
      params: Promise.resolve({ conversionId: "conversion-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("streams only the authenticated user's stored result", async () => {
    mockedAuthenticateApiKey.mockResolvedValue({
      apiKeyId: "key-1",
      userId: "user-1",
      storeConversions: true,
    });
    mockedDownloadStoredConversion.mockResolvedValue({
      body: new ReadableStream({ start(controller) { controller.enqueue(Buffer.from("png")); controller.close(); } }),
      fileName: "image.png",
      mimeType: "image/png",
    });

    const response = await GET(new Request("http://localhost/api/v1/conversions/conversion-1/download"), {
      params: Promise.resolve({ conversionId: "conversion-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("image.png");
    await expect(response.text()).resolves.toBe("png");
    expect(mockedDownloadStoredConversion).toHaveBeenCalledWith({ conversionId: "conversion-1", userId: "user-1" });
  });

  it("returns 404 without disclosing another user's result", async () => {
    mockedAuthenticateApiKey.mockResolvedValue({ apiKeyId: "key-1", userId: "user-1", storeConversions: true });
    mockedDownloadStoredConversion.mockRejectedValue(new StoredConversionNotFoundError());

    const response = await GET(new Request("http://localhost/api/v1/conversions/other/download"), {
      params: Promise.resolve({ conversionId: "other" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Stored conversion not found." });
  });
});

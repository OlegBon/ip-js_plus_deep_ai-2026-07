/** @jest-environment node */

import { POST } from "../route";
import { authenticateApiKey, createConversionRequest } from "@/lib/api/conversion-request";

jest.mock("@/lib/api/conversion-request", () => ({
  authenticateApiKey: jest.fn(),
  createConversionRequest: jest.fn(),
  isMultipartFormData: (contentType: string | null) => contentType?.startsWith("multipart/form-data") ?? false,
}));

const mockedAuthenticateApiKey = jest.mocked(authenticateApiKey);
const mockedCreateConversionRequest = jest.mocked(createConversionRequest);

describe("POST /api/v1/convert", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 without a valid API key", async () => {
    mockedAuthenticateApiKey.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/v1/convert", { method: "POST" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("requires multipart/form-data", async () => {
    mockedAuthenticateApiKey.mockResolvedValue({ apiKeyId: "key-1", userId: "user-1" });

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
    mockedAuthenticateApiKey.mockResolvedValue({ apiKeyId: "key-1", userId: "user-1" });
    mockedCreateConversionRequest.mockResolvedValue({
      conversion: {
        id: "conversion-1",
        status: "PENDING",
        createdAt: new Date("2026-08-24T12:00:00.000Z"),
      },
    });
    const formData = new FormData();
    formData.append("file", new Blob(["image"], { type: "image/png" }), "image.png");
    formData.append("targetFormat", "pdf");

    const response = await POST(
      new Request("http://localhost/api/v1/convert", { method: "POST", body: formData }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      conversionId: "conversion-1",
      status: "PENDING",
      createdAt: "2026-08-24T12:00:00.000Z",
    });
  });
});

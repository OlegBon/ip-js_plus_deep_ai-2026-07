/** @jest-environment node */

import { GET, POST } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { createApiKey, listApiKeys } from "@/lib/api/api-keys";

jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/api/api-keys", () => ({
  ApiKeyUserNotFoundError: class ApiKeyUserNotFoundError extends Error {},
  createApiKey: jest.fn(),
  listApiKeys: jest.fn(),
  normalizeApiKeyName: jest.requireActual("@/lib/api/api-keys").normalizeApiKeyName,
}));

const mockedSession = jest.mocked(getCurrentSession);
const mockedCreateApiKey = jest.mocked(createApiKey);
const mockedListApiKeys = jest.mocked(listApiKeys);

describe("/api/account/api-keys", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires a session to list API keys", async () => {
    mockedSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("lists only metadata and disables caching", async () => {
    mockedSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedListApiKeys.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ apiKeys: [] });
  });

  it("returns a newly generated secret once with no-store", async () => {
    mockedSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedCreateApiKey.mockResolvedValue({
      secret: "ch_live_secret",
      apiKey: { id: "key-1", name: "CLI", keyPrefix: "ch_live_secret", createdAt: new Date(), lastUsedAt: null, revokedAt: null },
    });

    const response = await POST(
      new Request("http://localhost/api/account/api-keys", { method: "POST", body: JSON.stringify({ name: "CLI" }) }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockedCreateApiKey).toHaveBeenCalledWith("user-1", "CLI");
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ secret: "ch_live_secret" }));
  });
});

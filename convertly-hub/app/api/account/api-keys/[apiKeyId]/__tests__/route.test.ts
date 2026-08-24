/** @jest-environment node */

import { DELETE } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { revokeApiKey } from "@/lib/api/api-keys";

jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/api/api-keys", () => ({
  ApiKeyUserNotFoundError: class ApiKeyUserNotFoundError extends Error {},
  revokeApiKey: jest.fn(),
}));

const mockedSession = jest.mocked(getCurrentSession);
const mockedRevokeApiKey = jest.mocked(revokeApiKey);

describe("DELETE /api/account/api-keys/:apiKeyId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires a session", async () => {
    mockedSession.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost/api/account/api-keys/key-1", { method: "DELETE" }), {
      params: Promise.resolve({ apiKeyId: "key-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("revokes the requested key for the current user", async () => {
    mockedSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedRevokeApiKey.mockResolvedValue(true);

    const response = await DELETE(new Request("http://localhost/api/account/api-keys/key-1", { method: "DELETE" }), {
      params: Promise.resolve({ apiKeyId: "key-1" }),
    });

    expect(response.status).toBe(204);
    expect(mockedRevokeApiKey).toHaveBeenCalledWith("user-1", "key-1");
  });

  it("does not disclose a key that is missing, revoked, or owned by another user", async () => {
    mockedSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedRevokeApiKey.mockResolvedValue(false);

    const response = await DELETE(new Request("http://localhost/api/account/api-keys/other", { method: "DELETE" }), {
      params: Promise.resolve({ apiKeyId: "other" }),
    });

    expect(response.status).toBe(404);
  });
});

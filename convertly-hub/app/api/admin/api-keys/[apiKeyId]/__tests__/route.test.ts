/** @jest-environment node */

import { DELETE } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { revokeAdminApiKey } from "@/lib/admin/user-management";

jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/admin/user-management", () => ({
  AdminAccessDeniedError: class AdminAccessDeniedError extends Error {},
  revokeAdminApiKey: jest.fn(),
}));

const mockedSession = jest.mocked(getCurrentSession);
const mockedRevokeAdminApiKey = jest.mocked(revokeAdminApiKey);

describe("DELETE /api/admin/api-keys/:apiKeyId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires a session", async () => {
    mockedSession.mockResolvedValue(null);
    expect((await DELETE(new Request("http://localhost/api/admin/api-keys/key-1", { method: "DELETE" }), {
      params: Promise.resolve({ apiKeyId: "key-1" }),
    })).status).toBe(401);
  });

  it("revokes an active key through the admin service", async () => {
    mockedSession.mockResolvedValue({ user: { id: "admin-1" } } as never);
    mockedRevokeAdminApiKey.mockResolvedValue(true);
    const response = await DELETE(new Request("http://localhost/api/admin/api-keys/key-1", { method: "DELETE" }), {
      params: Promise.resolve({ apiKeyId: "key-1" }),
    });

    expect(response.status).toBe(204);
    expect(mockedRevokeAdminApiKey).toHaveBeenCalledWith("admin-1", "key-1");
  });
});

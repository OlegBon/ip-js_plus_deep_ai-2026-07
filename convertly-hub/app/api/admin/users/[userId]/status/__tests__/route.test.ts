/** @jest-environment node */

import { PATCH } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { updateAdminUserStatus } from "@/lib/admin/user-management";

jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/admin/user-management", () => ({
  AdminAccessDeniedError: class AdminAccessDeniedError extends Error {},
  parseAdminUserStatus: jest.requireActual("@/lib/admin/user-management").parseAdminUserStatus,
  updateAdminUserStatus: jest.fn(),
}));

const mockedSession = jest.mocked(getCurrentSession);
const mockedUpdateAdminUserStatus = jest.mocked(updateAdminUserStatus);

describe("PATCH /api/admin/users/:userId/status", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates the requested status", async () => {
    mockedSession.mockResolvedValue({ user: { id: "admin-1" } } as never);
    const response = await PATCH(new Request("http://localhost/api/admin/users/user-1/status", {
      method: "PATCH", body: JSON.stringify({ status: "DELETED" }),
    }), { params: Promise.resolve({ userId: "user-1" }) });

    expect(response.status).toBe(400);
  });

  it("prevents self-suspension", async () => {
    mockedSession.mockResolvedValue({ user: { id: "admin-1" } } as never);
    mockedUpdateAdminUserStatus.mockResolvedValue("SELF_UPDATE_FORBIDDEN");
    const response = await PATCH(new Request("http://localhost/api/admin/users/admin-1/status", {
      method: "PATCH", body: JSON.stringify({ status: "SUSPENDED" }),
    }), { params: Promise.resolve({ userId: "admin-1" }) });

    expect(response.status).toBe(403);
  });
});

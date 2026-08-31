/** @jest-environment node */
import { POST } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { changePassword } from "@/lib/auth/account-security";

jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/auth/account-security", () => ({ changePassword: jest.fn() }));
const session = jest.mocked(getCurrentSession);
const change = jest.mocked(changePassword);

describe("POST /api/account/password", () => {
  beforeEach(() => { jest.clearAllMocks(); session.mockResolvedValue({ user: { id: "u1" } } as never); });
  it("rejects mismatched new passwords before calling the service", async () => { const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ currentPassword: "current", password: "a".repeat(12), confirmPassword: "different" }) })); expect(response.status).toBe(400); expect(change).not.toHaveBeenCalled(); });
  it("changes a matching password for the session user", async () => { change.mockResolvedValue({ ok: true }); const password = "a".repeat(12); const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ currentPassword: "current", password, confirmPassword: password }) })); expect(response.status).toBe(200); expect(change).toHaveBeenCalledWith("u1", "current", password); });
});

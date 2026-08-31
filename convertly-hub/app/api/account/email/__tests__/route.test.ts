/** @jest-environment node */
import { POST } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { requestEmailChange } from "@/lib/auth/account-security";
import { sendEmailVerification } from "@/lib/mail/send-auth-email";

jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/auth/account-security", () => ({ requestEmailChange: jest.fn() }));
jest.mock("@/lib/mail/send-auth-email", () => ({ sendEmailVerification: jest.fn() }));

const session = jest.mocked(getCurrentSession);
const change = jest.mocked(requestEmailChange);
const send = jest.mocked(sendEmailVerification);

describe("POST /api/account/email", () => {
  beforeEach(() => { jest.clearAllMocks(); session.mockResolvedValue({ user: { id: "u1" } } as never); });
  it("requires a session", async () => { session.mockResolvedValue(null); expect((await POST(new Request("http://localhost", { method: "POST" }))).status).toBe(401); });
  it("sends the verification link only after a valid protected request", async () => { change.mockResolvedValue({ email: "new@example.com", token: "token" }); const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ email: "new@example.com", currentPassword: "current" }) })); expect(response.status).toBe(202); expect(send).toHaveBeenCalledWith("new@example.com", "token"); });
  it("does not send mail when the current password is incorrect", async () => { change.mockResolvedValue({ error: "CURRENT_PASSWORD_INCORRECT" }); const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ email: "new@example.com", currentPassword: "wrong" }) })); expect(response.status).toBe(400); expect(send).not.toHaveBeenCalled(); });
});

/** @jest-environment node */

import { POST } from "../route";
import { registerUser } from "@/lib/auth/users";
import { createEmailVerification } from "@/lib/auth/recovery";
import { sendEmailVerification } from "@/lib/mail/send-auth-email";

jest.mock("@/lib/auth/users", () => ({ registerUser: jest.fn() }));
jest.mock("@/lib/auth/recovery", () => ({ createEmailVerification: jest.fn() }));
jest.mock("@/lib/mail/send-auth-email", () => ({ sendEmailVerification: jest.fn() }));

const mockedRegisterUser = jest.mocked(registerUser);
const mockedCreateEmailVerification = jest.mocked(createEmailVerification);
const mockedSendEmailVerification = jest.mocked(sendEmailVerification);

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateEmailVerification.mockResolvedValue({ email: "person@example.com", token: "verify-token", expiresAt: new Date() });
    mockedSendEmailVerification.mockResolvedValue(undefined);
  });

  it("creates an account and never returns its password", async () => {
    mockedRegisterUser.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          password: "a-secure-password",
          name: "Person",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ user: { id: "user-1", email: "person@example.com", name: "Person" }, emailVerificationSent: true });
    expect(mockedSendEmailVerification).toHaveBeenCalledWith("person@example.com", "verify-token");
  });

  it("keeps the created account when verification delivery is unavailable", async () => {
    mockedRegisterUser.mockResolvedValue({ user: { id: "user-1", email: "person@example.com", name: "Person" } });
    mockedSendEmailVerification.mockRejectedValue(new Error("SMTP unavailable"));

    const response = await POST(new Request("http://localhost/api/auth/register", { method: "POST", body: JSON.stringify({ email: "person@example.com", password: "a-secure-password" }) }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ user: { id: "user-1", email: "person@example.com", name: "Person" }, emailVerificationSent: false });
  });

  it("returns a validation error for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request body." });
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });
});

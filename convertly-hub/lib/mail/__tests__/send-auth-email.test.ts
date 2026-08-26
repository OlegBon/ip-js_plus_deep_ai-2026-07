import { emailVerificationUrl, passwordResetUrl } from "../send-auth-email";

describe("authentication email URLs", () => {
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (originalNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalNextAuthUrl;
  });

  it("uses NEXTAUTH_URL as the single public application origin", () => {
    process.env.NEXTAUTH_URL = "https://convertly.example/";

    expect(passwordResetUrl("reset token")).toBe("https://convertly.example/password-reset/reset%20token");
    expect(emailVerificationUrl("verify token")).toBe("https://convertly.example/email-verification/verify%20token");
  });
});

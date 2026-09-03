const mockSendMail = jest.fn();

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
  },
}));

import { sendEmailVerification } from "../send-auth-email";

describe("SMTP delivery diagnostics", () => {
  afterEach(() => {
    mockSendMail.mockReset();
    jest.restoreAllMocks();
  });

  it("logs only safe SMTP metadata when delivery fails", async () => {
    const transportError = Object.assign(new Error("535 credentials for support@example.com were rejected"), {
      code: "EAUTH",
      command: "AUTH LOGIN",
      responseCode: 535,
      response: "535 5.7.8 credentials were rejected",
    });
    mockSendMail.mockRejectedValue(transportError);
    const log = jest.spyOn(console, "error").mockImplementation();

    await expect(sendEmailVerification("recipient@example.com", "one-time-token")).rejects.toBe(transportError);

    expect(log).toHaveBeenCalledWith("Authentication email delivery failed.", {
      kind: "email-verification",
      errorName: "Error",
      code: "EAUTH",
      command: "AUTH LOGIN",
      responseCode: 535,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("recipient@example.com");
    expect(JSON.stringify(log.mock.calls)).not.toContain("one-time-token");
    expect(JSON.stringify(log.mock.calls)).not.toContain("credentials were rejected");
  });
});

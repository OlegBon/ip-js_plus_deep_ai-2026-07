/** @jest-environment node */

import { POST } from "../route";
import { isValidWebhookSecret, verifyTelegramLink } from "@/lib/telegram/linking";

jest.mock("@/lib/telegram/linking", () => ({
  isValidWebhookSecret: jest.fn(),
  verifyTelegramLink: jest.fn(),
}));

const mockedSecretCheck = jest.mocked(isValidWebhookSecret);
const mockedVerifyLink = jest.mocked(verifyTelegramLink);

describe("POST /api/telegram/webhook", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a request without the Telegram webhook secret", async () => {
    mockedSecretCheck.mockReturnValue(false);

    const response = await POST(new Request("http://localhost/api/telegram/webhook", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("passes a valid start token to the linking service", async () => {
    mockedSecretCheck.mockReturnValue(true);
    mockedVerifyLink.mockResolvedValue(true);

    const response = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        body: JSON.stringify({ message: { chat: { id: 123456 }, text: "/start link_abcdefghijklmnopqrst" } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedVerifyLink).toHaveBeenCalledWith("123456", "abcdefghijklmnopqrst");
  });
});

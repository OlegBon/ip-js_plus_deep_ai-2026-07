import { prisma } from "@/lib/prisma";
import { createTelegramLink, isValidWebhookSecret, verifyTelegramLink } from "../linking";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = jest.mocked(prisma, { shallow: false });

describe("Telegram linking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TELEGRAM_BOT_USERNAME = "convertly_test_bot";
    process.env.TELEGRAM_WEBHOOK_SECRET = "webhook-secret";
  });

  it("stores only a token hash and returns a bot deep link", async () => {
    mockedPrisma.user.update.mockResolvedValue({} as never);

    const result = await createTelegramLink("user-1");

    expect(result.deepLink).toMatch(/^https:\/\/t\.me\/convertly_test_bot\?start=link_/);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        telegramVerificationTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        telegramVerificationExpires: expect.any(Date),
      }),
    });
  });

  it("links an unexpired token once and removes its hash", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      telegramVerificationExpires: new Date(Date.now() + 60_000),
    } as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);

    await expect(verifyTelegramLink("123456", "test-token")).resolves.toBe(true);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        telegramId: "123456",
        telegramVerificationTokenHash: null,
        telegramVerificationExpires: null,
      }),
    });
  });

  it("rejects a missing or mismatched webhook secret", () => {
    expect(isValidWebhookSecret(null)).toBe(false);
    expect(isValidWebhookSecret("wrong-secret")).toBe(false);
    expect(isValidWebhookSecret("webhook-secret")).toBe(true);
  });
});

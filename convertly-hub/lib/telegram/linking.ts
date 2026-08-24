import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MINUTES = 15;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBotUsername() {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");

  if (!username || !/^[a-zA-Z0-9_]{5,32}$/.test(username)) {
    throw new Error("Telegram bot username is not configured.");
  }

  return username;
}

export async function createTelegramLink(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramVerificationTokenHash: hashToken(token),
      telegramVerificationExpires: expiresAt,
      telegramVerified: null,
    },
  });

  return {
    deepLink: `https://t.me/${getBotUsername()}?start=link_${token}`,
    expiresAt,
  };
}

export async function verifyTelegramLink(chatId: string, token: string) {
  const tokenHash = hashToken(token);
  const user = await prisma.user.findUnique({
    where: { telegramVerificationTokenHash: tokenHash },
    select: { id: true, telegramVerificationExpires: true },
  });

  if (!user || !user.telegramVerificationExpires || user.telegramVerificationExpires <= new Date()) {
    return false;
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramId: chatId,
        telegramVerified: new Date(),
        telegramVerificationTokenHash: null,
        telegramVerificationExpires: null,
      },
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }
    throw error;
  }
}

export function isValidWebhookSecret(value: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!value || !expected) {
    return false;
  }

  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

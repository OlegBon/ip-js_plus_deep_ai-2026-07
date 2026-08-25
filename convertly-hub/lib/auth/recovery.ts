import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const PASSWORD_SALT_ROUNDS = 12;
const PASSWORD_MINIMUM_LENGTH = 12;
const TOKEN_TTL_MINUTES = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function expiresAt() {
  return new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
}

export function isValidPassword(password: string) {
  return password.length >= PASSWORD_MINIMUM_LENGTH && password.length <= 128;
}

export async function createPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true },
  });

  if (!user) {
    return null;
  }

  const token = createToken();
  const tokenExpiresAt = expiresAt();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: hashToken(token), passwordResetExpires: tokenExpiresAt },
  });

  return { email: user.email, token, expiresAt: tokenExpiresAt };
}

export async function resetPassword(token: string, password: string) {
  if (!isValidPassword(password) || !token || token.length > 256) {
    return false;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const result = await prisma.user.updateMany({
    where: { passwordResetTokenHash: hashToken(token), passwordResetExpires: { gt: new Date() } },
    data: { password: passwordHash, passwordResetTokenHash: null, passwordResetExpires: null },
  });
  return result.count === 1;
}

export async function createEmailVerification(userId: string) {
  const token = createToken();
  const tokenExpiresAt = expiresAt();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: null,
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: tokenExpiresAt,
    },
    select: { email: true },
  });

  return { email: user.email, token, expiresAt: tokenExpiresAt };
}

export async function verifyEmail(token: string) {
  if (!token || token.length > 256) {
    return false;
  }

  const result = await prisma.user.updateMany({
    where: { emailVerificationTokenHash: hashToken(token), emailVerificationExpires: { gt: new Date() } },
    data: { emailVerified: new Date(), emailVerificationTokenHash: null, emailVerificationExpires: null },
  });
  return result.count === 1;
}

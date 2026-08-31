import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { isPasswordValid } from '@/lib/auth/password-policy';

const SALT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestEmailChange(
  userId: string,
  inputEmail: string,
  currentPassword: string,
) {
  const email = normalizeEmail(inputEmail);
  if (email.length > 254 || !EMAIL_PATTERN.test(email) || !currentPassword)
    return { error: 'INVALID_INPUT' as const };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, password: true, status: true },
  });
  if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(currentPassword, user.password)))
    return { error: 'CURRENT_PASSWORD_INCORRECT' as const };
  if (email === user.email) return { error: 'SAME_EMAIL' as const };
  const occupied = await prisma.user.findFirst({
    where: { OR: [{ email }, { pendingEmail: email }], NOT: { id: userId } },
    select: { id: true },
  });
  if (occupied) return { error: 'EMAIL_TAKEN' as const };
  const token = randomBytes(32).toString('base64url');
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: email,
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  } catch (error) {
    if (isUniqueError(error)) return { error: 'EMAIL_TAKEN' as const };
    throw error;
  }
  return { email, token };
}

export async function changePassword(userId: string, currentPassword: string, password: string) {
  if (!currentPassword || !isPasswordValid(password)) return { error: 'INVALID_INPUT' as const };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, status: true },
  });
  if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(currentPassword, user.password)))
    return { error: 'CURRENT_PASSWORD_INCORRECT' as const };
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await bcrypt.hash(password, SALT_ROUNDS),
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  });
  return { ok: true as const };
}

function isUniqueError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

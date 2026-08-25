import bcrypt from "bcrypt";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PASSWORD_SALT_ROUNDS = 12;
const MINIMUM_PASSWORD_LENGTH = 12;
const DUMMY_PASSWORD_HASH = "$2b$12$6HlhQPi20LT0i9mx0qVbcuQfF7R4q9s15Nb65.V4Tyr2GKUbStGwu";

type CredentialsInput = {
  email?: string;
  password?: string;
};

type RegisterUserInput = CredentialsInput & {
  name?: string;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

type RegistrationResult =
  | { user: Pick<AuthenticatedUser, "id" | "email" | "name"> }
  | { error: "INVALID_INPUT" | "EMAIL_TAKEN" };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string) {
  return password.length >= MINIMUM_PASSWORD_LENGTH && password.length <= 128;
}

export async function registerUser(input: RegisterUserInput): Promise<RegistrationResult> {
  const email = typeof input?.email === "string" ? normalizeEmail(input.email) : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!isValidEmail(email) || !isValidPassword(password) || name.length > 100) {
    return { error: "INVALID_INPUT" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "EMAIL_TAKEN" };
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: name || null,
        subscription: { create: { activePlan: "FREE" } },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return { user };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "EMAIL_TAKEN" };
    }

    throw error;
  }
}

export async function authenticateUser(input?: CredentialsInput): Promise<AuthenticatedUser | null> {
  const email = typeof input?.email === "string" ? normalizeEmail(input.email) : "";
  const password = typeof input?.password === "string" ? input.password : "";

  if (!isValidEmail(email) || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      status: true,
    },
  });

  const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export const passwordRequirements = {
  minLength: MINIMUM_PASSWORD_LENGTH,
};

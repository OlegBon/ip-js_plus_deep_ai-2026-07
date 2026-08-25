import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getActivePlanForUser } from "@/lib/billing/subscriptions";
import { getPlanDefinition } from "@/lib/billing/plans";

const API_KEY_PREFIX = "ch_live_";
const DISPLAY_PREFIX_LENGTH = 16;
const DEFAULT_API_KEY_NAME = "Default";
const MAX_API_KEY_NAME_LENGTH = 64;

export type ApiKeyMetadata = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export class ApiKeyUserNotFoundError extends Error {}
export class ApiKeyPlanNotEligibleError extends Error {}

export function normalizeApiKeyName(value: unknown) {
  if (value === undefined) return DEFAULT_API_KEY_NAME;
  if (typeof value !== "string") return null;

  const name = value.trim();
  if (!name || name.length > MAX_API_KEY_NAME_LENGTH) return null;
  return name;
}

export async function listApiKeys(userId: string) {
  await ensureActiveUser(userId);
  return prisma.apiKey.findMany({
    where: { userId },
    select: apiKeyMetadataSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function createApiKey(userId: string, name: string) {
  await ensureActiveUser(userId);
  const plan = await getActivePlanForUser(userId);
  if (!getPlanDefinition(plan).apiAccess) throw new ApiKeyPlanNotEligibleError();

  const secret = `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash: hashApiKey(secret),
      keyPrefix: secret.slice(0, DISPLAY_PREFIX_LENGTH),
    },
    select: apiKeyMetadataSelect,
  });

  return { apiKey, secret };
}

export async function revokeApiKey(userId: string, apiKeyId: string) {
  await ensureActiveUser(userId);

  const revoked = await prisma.apiKey.updateMany({
    where: { id: apiKeyId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return revoked.count > 0;
}

export function hashApiKey(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

const apiKeyMetadataSelect = {
  id: true,
  name: true,
  keyPrefix: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
} as const;

async function ensureActiveUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    throw new ApiKeyUserNotFoundError();
  }
}

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  SUPPORTED_SOURCE_MIME_TYPES,
  SUPPORTED_TARGET_FORMATS,
} from "@/lib/files/upload-policy";
import { getPlanDefinition } from "@/lib/billing/plans";
import type { SubscriptionPlan } from "@prisma/client";

export type ConversionPrincipal = {
  userId: string;
  storeConversions: boolean;
  plan?: SubscriptionPlan;
  apiKeyId?: string;
};

type CreateConversionInput = {
  file: File;
  targetFormat: string;
};

type ConversionRequestValidation =
  | { error: "UNSUPPORTED_TARGET_FORMAT" | "UNSUPPORTED_FILE" | "FILE_TOO_LARGE" }
  | { targetFormat: string };

export class ConversionQuotaExceededError extends Error {}

export async function authenticateApiKey(authorization: string | null): Promise<ConversionPrincipal | null> {
  const key = parseBearerToken(authorization);
  if (!key) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: createHash("sha256").update(key).digest("hex") },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      user: {
        select: {
          status: true,
          storeConversions: true,
          plan: true,
          subscription: { select: { activePlan: true } },
        },
      },
    },
  });

  if (!apiKey || apiKey.revokedAt || apiKey.user.status !== "ACTIVE") return null;

  return {
    apiKeyId: apiKey.id,
    userId: apiKey.userId,
    storeConversions: effectiveStoreConversions(apiKey.user.subscription?.activePlan ?? apiKey.user.plan, apiKey.user.storeConversions),
    plan: apiKey.user.subscription?.activePlan ?? apiKey.user.plan,
  };
}

export async function getSessionConversionPrincipal(userId: string): Promise<ConversionPrincipal | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      storeConversions: true,
      plan: true,
      subscription: { select: { activePlan: true } },
    },
  });

  if (!user || user.status !== "ACTIVE") return null;

  const plan = user.subscription?.activePlan ?? user.plan;
  return { userId: user.id, plan, storeConversions: effectiveStoreConversions(plan, user.storeConversions) };
}

export async function createConversionRequest(principal: ConversionPrincipal, input: CreateConversionInput) {
  const plan = getPlanDefinition(principal.plan ?? "FREE");
  const validation = validateConversionRequest(input, plan.maxFileSizeBytes);
  if ("error" in validation) return validation;

  const periodStart = startOfCurrentMonth();
  const completedConversions = await prisma.conversionLog.count({
    where: { userId: principal.userId, status: "COMPLETED", createdAt: { gte: periodStart } },
  });
  if (completedConversions >= plan.monthlyConversions) throw new ConversionQuotaExceededError();

  const conversion = await prisma.$transaction(async (transaction) => {
    const created = await transaction.conversionLog.create({
      data: {
        sourceFileName: sanitizeFileName(input.file.name),
        sourceMimeType: input.file.type,
        sourceSize: BigInt(input.file.size),
        targetFormat: validation.targetFormat,
        userId: principal.userId,
        apiKeyId: principal.apiKeyId,
      },
      select: { id: true, status: true, createdAt: true },
    });
    if (principal.apiKeyId) {
      await transaction.apiKey.update({
        where: { id: principal.apiKeyId },
        data: { lastUsedAt: new Date() },
      });
    }
    return created;
  });

  return { conversion };
}

function effectiveStoreConversions(plan: SubscriptionPlan, storeConversions: boolean) {
  return plan === "FREE" ? true : storeConversions;
}

export function validateConversionRequest(input: CreateConversionInput, maxUploadSizeBytes = getPlanDefinition("FREE").maxFileSizeBytes): ConversionRequestValidation {
  const targetFormat = input.targetFormat.trim().toLowerCase();
  if (!SUPPORTED_TARGET_FORMATS.has(targetFormat)) {
    return { error: "UNSUPPORTED_TARGET_FORMAT" };
  }
  if (!input.file.name || input.file.size === 0 || !SUPPORTED_SOURCE_MIME_TYPES.has(input.file.type)) {
    return { error: "UNSUPPORTED_FILE" };
  }
  if (input.file.size > maxUploadSizeBytes) {
    return { error: "FILE_TOO_LARGE" };
  }
  return { targetFormat };
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function isMultipartFormData(contentType: string | null) {
  return contentType?.toLowerCase().startsWith("multipart/form-data") ?? false;
}

function parseBearerToken(authorization: string | null) {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1];
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/\u0000-\u001F]/g, "_").slice(0, 255);
}

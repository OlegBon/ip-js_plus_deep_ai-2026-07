import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  MAX_UPLOAD_SIZE_BYTES,
  SUPPORTED_SOURCE_MIME_TYPES,
  SUPPORTED_TARGET_FORMATS,
} from "@/lib/files/upload-policy";

type ApiPrincipal = {
  apiKeyId: string;
  userId: string;
};

type CreateConversionInput = {
  file: File;
  targetFormat: string;
};

export async function authenticateApiKey(authorization: string | null): Promise<ApiPrincipal | null> {
  const key = parseBearerToken(authorization);
  if (!key) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: createHash("sha256").update(key).digest("hex") },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      user: { select: { status: true } },
    },
  });

  if (!apiKey || apiKey.revokedAt || apiKey.user.status !== "ACTIVE") return null;

  return { apiKeyId: apiKey.id, userId: apiKey.userId };
}

export async function createConversionRequest(principal: ApiPrincipal, input: CreateConversionInput) {
  const targetFormat = input.targetFormat.trim().toLowerCase();
  if (!SUPPORTED_TARGET_FORMATS.has(targetFormat)) {
    return { error: "UNSUPPORTED_TARGET_FORMAT" as const };
  }
  if (!input.file.name || input.file.size === 0 || !SUPPORTED_SOURCE_MIME_TYPES.has(input.file.type)) {
    return { error: "UNSUPPORTED_FILE" as const };
  }
  if (input.file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { error: "FILE_TOO_LARGE" as const };
  }

  const conversion = await prisma.$transaction(async (transaction) => {
    const created = await transaction.conversionLog.create({
      data: {
        sourceFileName: sanitizeFileName(input.file.name),
        sourceMimeType: input.file.type,
        sourceSize: BigInt(input.file.size),
        targetFormat,
        userId: principal.userId,
        apiKeyId: principal.apiKeyId,
      },
      select: { id: true, status: true, createdAt: true },
    });
    await transaction.apiKey.update({
      where: { id: principal.apiKeyId },
      data: { lastUsedAt: new Date() },
    });
    return created;
  });

  return { conversion };
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

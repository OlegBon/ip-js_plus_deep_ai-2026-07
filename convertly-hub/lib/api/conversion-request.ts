import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const SUPPORTED_TARGET_FORMATS = new Set(["jpg", "png", "pdf"]);

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
  if (!input.file.name || input.file.size === 0 || !SUPPORTED_MIME_TYPES.has(input.file.type)) {
    return { error: "UNSUPPORTED_FILE" as const };
  }
  if (input.file.size > MAX_FILE_SIZE_BYTES) {
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

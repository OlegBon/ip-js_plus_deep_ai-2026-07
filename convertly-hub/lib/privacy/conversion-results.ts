import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/s3";
import type { CoreConversionResult } from "@/lib/core/conversion";

type StoreConversionResultInput = CoreConversionResult & {
  conversionId: string;
  userId: string;
};

type DownloadStoredConversionInput = {
  conversionId: string;
  userId: string;
};

export class StoredConversionNotFoundError extends Error {}

export function createStoredConversionKey({ conversionId, userId, fileName }: StoreConversionResultInput) {
  return `users/${userId}/conversions/${conversionId}/${encodeURIComponent(sanitizeFileName(fileName))}`;
}

export async function storeConversionResult(input: StoreConversionResultInput) {
  const storageKey = createStoredConversionKey(input);
  await getStorageService().uploadFile({
    key: storageKey,
    body: input.data,
    contentType: input.mimeType,
    contentLength: input.data.length,
  });
  return storageKey;
}

export async function downloadStoredConversion({ conversionId, userId }: DownloadStoredConversionInput) {
  const conversion = await prisma.conversionLog.findFirst({
    where: {
      id: conversionId,
      userId,
      status: "COMPLETED",
      storageKey: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      storageKey: true,
      resultFileName: true,
      resultMimeType: true,
    },
  });
  if (!conversion?.storageKey || !conversion.resultFileName || !conversion.resultMimeType) {
    throw new StoredConversionNotFoundError();
  }

  const storedFile = await getStorageService().downloadFile(conversion.storageKey);
  return {
    body: toWebStream(storedFile.Body),
    fileName: conversion.resultFileName,
    mimeType: conversion.resultMimeType,
  };
}

function toWebStream(body: unknown): ReadableStream<Uint8Array> {
  if (body instanceof Readable) {
    return Readable.toWeb(body) as ReadableStream<Uint8Array>;
  }

  if (body && typeof body === "object" && "transformToWebStream" in body) {
    return (body as { transformToWebStream: () => ReadableStream<Uint8Array> }).transformToWebStream();
  }

  throw new Error("Stored conversion has an unsupported response body.");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/\u0000-\u001F]/g, "_").slice(0, 255) || "converted-file";
}

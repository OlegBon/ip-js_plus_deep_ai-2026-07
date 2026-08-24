import { basename, extname } from "path";
import sharp from "sharp";

const GOTENBERG_URL = process.env.GOTENBERG_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const GOTENBERG_TIMEOUT_MS = 30_000;

export type CoreConversionInput = {
  data: Buffer;
  sourceFileName: string;
  sourceMimeType: string;
  targetFormat: string;
};

export type CoreConversionResult = {
  data: Buffer;
  fileName: string;
  mimeType: string;
};

export class CoreConversionError extends Error {
  constructor(message: string, readonly code: "INVALID_FILE" | "UNSUPPORTED_CONVERSION" | "PROCESSING_FAILED") {
    super(message);
  }
}

export function validateCoreConversion(input: CoreConversionInput) {
  const targetFormat = input.targetFormat.toLowerCase();

  if (input.sourceMimeType === "image/jpeg" && targetFormat === "png") {
    assertSignature(input.data, "image/jpeg");
    return;
  }
  if (input.sourceMimeType === "image/png" && targetFormat === "jpg") {
    assertSignature(input.data, "image/png");
    return;
  }
  if (
    input.sourceMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    targetFormat === "pdf"
  ) {
    assertSignature(input.data, "docx");
    return;
  }

  throw new CoreConversionError("This source and target format combination is not supported.", "UNSUPPORTED_CONVERSION");
}

export async function convertFile(input: CoreConversionInput): Promise<CoreConversionResult> {
  validateCoreConversion(input);

  if (input.sourceMimeType === "image/jpeg") {
    return createImageResult(await sharp(input.data).png().toBuffer(), input.sourceFileName, "png", "image/png");
  }
  if (input.sourceMimeType === "image/png") {
    return createImageResult(await sharp(input.data).jpeg().toBuffer(), input.sourceFileName, "jpg", "image/jpeg");
  }

  return convertDocxToPdf(input);
}

function assertSignature(data: Buffer, type: "image/jpeg" | "image/png" | "docx") {
  const valid =
    (type === "image/jpeg" && data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ||
    (type === "image/png" && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (type === "docx" && data.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])));

  if (!valid) {
    throw new CoreConversionError("The file content does not match its declared type.", "INVALID_FILE");
  }
}

async function convertDocxToPdf(input: CoreConversionInput): Promise<CoreConversionResult> {
  const formData = new FormData();
  formData.append(
    "files",
    new Blob([Uint8Array.from(input.data)], { type: input.sourceMimeType }),
    sanitizeFileName(input.sourceFileName),
  );

  try {
    const response = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(GOTENBERG_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new CoreConversionError("The document could not be converted.", "PROCESSING_FAILED");
    }

    const data = Buffer.from(await response.arrayBuffer());
    if (!data.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new CoreConversionError("The document worker returned an invalid result.", "PROCESSING_FAILED");
    }

    return createImageResult(data, input.sourceFileName, "pdf", "application/pdf");
  } catch (error) {
    if (error instanceof CoreConversionError) throw error;
    throw new CoreConversionError("The document worker is unavailable.", "PROCESSING_FAILED");
  }
}

function createImageResult(data: Buffer, sourceFileName: string, extension: string, mimeType: string): CoreConversionResult {
  const sourceBaseName = basename(sanitizeFileName(sourceFileName), extname(sourceFileName)) || "converted";
  return { data, fileName: `${sourceBaseName}.${extension}`, mimeType };
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/\u0000-\u001F]/g, "_").slice(0, 255);
}

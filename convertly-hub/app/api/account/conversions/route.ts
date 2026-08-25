import { after, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ConversionQuotaExceededError,
  createConversionRequest,
  getSessionConversionPrincipal,
  isMultipartFormData,
  validateConversionRequest,
} from "@/lib/api/conversion-request";
import { getPlanDefinition } from "@/lib/billing/plans";
import { CoreConversionError, validateCoreConversion } from "@/lib/core/conversion";
import { processConversionJob } from "@/lib/core/conversion-job";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const conversions = await prisma.conversionLog.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      sourceFileName: true,
      targetFormat: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      storageKey: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ conversions }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return unauthorized();

  const principal = await getSessionConversionPrincipal(session.user.id);
  if (!principal) return unauthorized();

  if (!isMultipartFormData(request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Content-Type must be multipart/form-data." }, { status: 415 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  const targetFormat = formData.get("targetFormat");
  if (!(file instanceof File) || typeof targetFormat !== "string") {
    return NextResponse.json({ error: "Fields file and targetFormat are required." }, { status: 400 });
  }

  const validation = validateConversionRequest({ file, targetFormat }, getPlanDefinition(principal.plan ?? "FREE").maxFileSizeBytes);
  if ("error" in validation) return conversionValidationError(validation.error);

  const fileData = Buffer.from(await file.arrayBuffer());
  try {
    validateCoreConversion({
      data: fileData,
      sourceFileName: file.name,
      sourceMimeType: file.type,
      targetFormat: validation.targetFormat,
    });
  } catch (error) {
    if (error instanceof CoreConversionError) {
      return NextResponse.json({ error: error.message }, { status: error.code === "INVALID_FILE" ? 415 : 422 });
    }
    return NextResponse.json({ error: "Unable to validate source file." }, { status: 400 });
  }

  let created;
  try {
    created = await createConversionRequest(principal, { file, targetFormat: validation.targetFormat });
  } catch (error) {
    if (error instanceof ConversionQuotaExceededError) {
      return NextResponse.json({ error: "Monthly conversion limit reached for the active plan." }, { status: 429 });
    }
    return NextResponse.json({ error: "Unable to create conversion request." }, { status: 503 });
  }
  if ("error" in created) return conversionValidationError(created.error);

  const job = {
    conversionId: created.conversion.id,
    data: fileData,
    sourceFileName: file.name,
    sourceMimeType: file.type,
    targetFormat: validation.targetFormat,
    userId: principal.userId,
    storeResult: principal.storeConversions,
    plan: principal.plan ?? "FREE",
  };

  if (!principal.storeConversions) {
    const converted = await processConversionJob(job);
    if (!converted) return NextResponse.json({ error: "Unable to convert the source file." }, { status: 422 });

    return new Response(new Uint8Array(converted.data), {
      headers: {
        "Content-Type": converted.mimeType,
        "Content-Disposition": contentDisposition(converted.fileName),
        "Cache-Control": "no-store",
      },
    });
  }

  after(() => processConversionJob(job));
  return NextResponse.json(
    {
      conversionId: created.conversion.id,
      status: created.conversion.status,
      createdAt: created.conversion.createdAt.toISOString(),
    },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  );
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function contentDisposition(fileName: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function conversionValidationError(error: "FILE_TOO_LARGE" | "UNSUPPORTED_FILE" | "UNSUPPORTED_TARGET_FORMAT") {
  switch (error) {
    case "FILE_TOO_LARGE":
      return NextResponse.json({ error: "File exceeds the active plan limit." }, { status: 413 });
    case "UNSUPPORTED_FILE":
      return NextResponse.json({ error: "Unsupported source file." }, { status: 415 });
    case "UNSUPPORTED_TARGET_FORMAT":
      return NextResponse.json({ error: "Unsupported target format." }, { status: 422 });
  }
}

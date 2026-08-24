import { after, NextResponse } from "next/server";
import {
  authenticateApiKey,
  createConversionRequest,
  isMultipartFormData,
} from "@/lib/api/conversion-request";
import { CoreConversionError, validateCoreConversion } from "@/lib/core/conversion";
import { processConversionJob } from "@/lib/core/conversion-job";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const principal = await authenticateApiKey(request.headers.get("authorization"));
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  const fileData = Buffer.from(await file.arrayBuffer());
  try {
    validateCoreConversion({
      data: fileData,
      sourceFileName: file.name,
      sourceMimeType: file.type,
      targetFormat,
    });
  } catch (error) {
    if (error instanceof CoreConversionError) {
      const status = error.code === "INVALID_FILE" ? 415 : 422;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Unable to validate source file." }, { status: 400 });
  }

  const result = await createConversionRequest(principal, { file, targetFormat });
  if ("error" in result) {
    switch (result.error) {
      case "FILE_TOO_LARGE":
        return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 413 });
      case "UNSUPPORTED_FILE":
        return NextResponse.json({ error: "Unsupported source file." }, { status: 415 });
      case "UNSUPPORTED_TARGET_FORMAT":
        return NextResponse.json({ error: "Unsupported target format." }, { status: 422 });
    }
  }

  const job = {
    conversionId: result.conversion.id,
    data: fileData,
    sourceFileName: file.name,
    sourceMimeType: file.type,
    targetFormat,
    userId: principal.userId,
    storeResult: principal.storeConversions,
  };

  if (!principal.storeConversions) {
    const converted = await processConversionJob(job);
    if (!converted) {
      return NextResponse.json({ error: "Unable to convert the source file." }, { status: 422 });
    }

    return new Response(new Uint8Array(converted.data), {
      status: 200,
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
      conversionId: result.conversion.id,
      status: result.conversion.status,
      createdAt: result.conversion.createdAt.toISOString(),
    },
    { status: 202 },
  );
}

function contentDisposition(fileName: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

import { NextResponse } from "next/server";
import {
  authenticateApiKey,
  createConversionRequest,
  isMultipartFormData,
} from "@/lib/api/conversion-request";

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

  return NextResponse.json(
    {
      conversionId: result.conversion.id,
      status: result.conversion.status,
      createdAt: result.conversion.createdAt.toISOString(),
    },
    { status: 202 },
  );
}

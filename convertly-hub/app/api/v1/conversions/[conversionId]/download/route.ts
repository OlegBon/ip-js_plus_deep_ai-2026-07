import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api/conversion-request";
import {
  downloadStoredConversion,
  StoredConversionNotFoundError,
} from "@/lib/privacy/conversion-results";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ conversionId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const principal = await authenticateApiKey(request.headers.get("authorization"));
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { conversionId } = await params;
  try {
    const result = await downloadStoredConversion({ conversionId, userId: principal.userId });
    return new Response(result.body, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof StoredConversionNotFoundError) {
      return NextResponse.json({ error: "Stored conversion not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to download stored conversion." }, { status: 503 });
  }
}

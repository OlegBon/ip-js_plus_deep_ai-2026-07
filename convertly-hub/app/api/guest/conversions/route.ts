import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMultipartFormData, validateConversionRequest } from "@/lib/api/conversion-request";
import { CoreConversionError, convertFile, validateCoreConversion } from "@/lib/core/conversion";

const COOKIE = "convertly_guest"; const MAX_SIZE = 1024 * 1024;
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isMultipartFormData(request.headers.get("content-type"))) return NextResponse.json({ error: "Content-Type must be multipart/form-data." }, { status: 415 });
  const form = await request.formData(); const file = form.get("file"); const targetFormat = form.get("targetFormat");
  if (!(file instanceof File) || typeof targetFormat !== "string") return NextResponse.json({ error: "Fields file and targetFormat are required." }, { status: 400 });
  const validation = validateConversionRequest({ file, targetFormat }, MAX_SIZE); if ("error" in validation) return NextResponse.json({ error: validation.error === "FILE_TOO_LARGE" ? "Guest files must be 1 MB or smaller." : "Unsupported guest conversion." }, { status: validation.error === "FILE_TOO_LARGE" ? 413 : 415 });
  const isImage = file.type === "image/jpeg" || file.type === "image/png"; const isDocument = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if ((!isImage && !isDocument) || (isImage && !["jpg", "png"].includes(validation.targetFormat)) || (isDocument && validation.targetFormat !== "pdf")) return NextResponse.json({ error: "Unsupported guest conversion." }, { status: 422 });
  const store = await cookies(); let visitor = store.get(COOKIE)?.value; const isNew = !visitor; if (!visitor) visitor = randomBytes(32).toString("base64url");
  const periodStart = new Date(); periodStart.setUTCDate(1); periodStart.setUTCHours(0,0,0,0); const visitorHash = createHash("sha256").update(visitor).digest("hex");
  const quota = await prisma.guestConversionQuota.upsert({ where: { visitorHash_periodStart: { visitorHash, periodStart } }, create: { visitorHash, periodStart }, update: {} }); const count = isImage ? quota.imageCount : quota.documentCount; const limit = isImage ? 3 : 2;
  if (count >= limit) return NextResponse.json({ error: `Monthly ${isImage ? "image" : "document"} guest limit reached.` }, { status: 429 });
  const data = Buffer.from(await file.arrayBuffer()); try { validateCoreConversion({ data, sourceFileName: file.name, sourceMimeType: file.type, targetFormat: validation.targetFormat }); const result = await convertFile({ data, sourceFileName: file.name, sourceMimeType: file.type, targetFormat: validation.targetFormat }); await prisma.guestConversionQuota.update({ where: { id: quota.id }, data: isImage ? { imageCount: { increment: 1 } } : { documentCount: { increment: 1 } } }); const response = new NextResponse(new Uint8Array(result.data), { headers: { "Content-Type": result.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`, "Cache-Control": "no-store" } }); if (isNew) response.cookies.set(COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 32, path: "/" }); return response; } catch (error) { return NextResponse.json({ error: error instanceof CoreConversionError ? error.message : "Unable to convert the source file." }, { status: 422 }); }
}

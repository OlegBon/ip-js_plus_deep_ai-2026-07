import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMultipartFormData, validateConversionRequest } from '@/lib/api/conversion-request';
import { CoreConversionError, convertFile, validateCoreConversion } from '@/lib/core/conversion';
import { allowGuestRequest } from '@/lib/guest/rate-limit';

const COOKIE = 'convertly_guest';
const MAX_SIZE = 1024 * 1024;
const IMAGE_LIMIT = 3;
const DOCUMENT_LIMIT = 2;

export const runtime = 'nodejs';

export async function GET() {
  const visitor = (await cookies()).get(COOKIE)?.value;
  if (!visitor) return quotaResponse({ imageCount: 0, documentCount: 0 });
  const quota = await prisma.guestConversionQuota.findUnique({
    where: {
      visitorHash_periodStart: {
        visitorHash: visitorHash(visitor),
        periodStart: currentPeriodStart(),
      },
    },
    select: { imageCount: true, documentCount: true },
  });
  return quotaResponse(quota ?? { imageCount: 0, documentCount: 0 });
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!allowGuestRequest(ip))
    return NextResponse.json(
      { error: 'Too many guest conversion requests. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  if (!isMultipartFormData(request.headers.get('content-type')))
    return NextResponse.json(
      { error: 'Content-Type must be multipart/form-data.' },
      { status: 415 },
    );

  const form = await request.formData();
  const file = form.get('file');
  const targetFormat = form.get('targetFormat');
  if (!(file instanceof File) || typeof targetFormat !== 'string')
    return NextResponse.json(
      { error: 'Fields file and targetFormat are required.' },
      { status: 400 },
    );
  const validation = validateConversionRequest({ file, targetFormat }, MAX_SIZE);
  if ('error' in validation)
    return NextResponse.json(
      {
        error:
          validation.error === 'FILE_TOO_LARGE'
            ? 'Guest files must be 1 MB or smaller.'
            : 'Unsupported guest conversion.',
      },
      { status: validation.error === 'FILE_TOO_LARGE' ? 413 : 415 },
    );

  const kind = conversionKind(file.type, validation.targetFormat);
  if (!kind) return NextResponse.json({ error: 'Unsupported guest conversion.' }, { status: 422 });
  const store = await cookies();
  let visitor = store.get(COOKIE)?.value;
  const isNewVisitor = !visitor;
  if (!visitor) visitor = randomBytes(32).toString('base64url');

  const quota = await prisma.guestConversionQuota.upsert({
    where: {
      visitorHash_periodStart: {
        visitorHash: visitorHash(visitor),
        periodStart: currentPeriodStart(),
      },
    },
    create: { visitorHash: visitorHash(visitor), periodStart: currentPeriodStart() },
    update: {},
    select: { id: true },
  });
  const reserved = await prisma.guestConversionQuota.updateMany({
    where:
      kind === 'image'
        ? { id: quota.id, imageCount: { lt: IMAGE_LIMIT } }
        : { id: quota.id, documentCount: { lt: DOCUMENT_LIMIT } },
    data: kind === 'image' ? { imageCount: { increment: 1 } } : { documentCount: { increment: 1 } },
  });
  if (reserved.count !== 1) return quotaExceeded(kind, quota.id);

  const data = Buffer.from(await file.arrayBuffer());
  try {
    validateCoreConversion({
      data,
      sourceFileName: file.name,
      sourceMimeType: file.type,
      targetFormat: validation.targetFormat,
    });
    const result = await convertFile({
      data,
      sourceFileName: file.name,
      sourceMimeType: file.type,
      targetFormat: validation.targetFormat,
    });
    const counts = await prisma.guestConversionQuota.findUniqueOrThrow({
      where: { id: quota.id },
      select: { imageCount: true, documentCount: true },
    });
    const response = new NextResponse(new Uint8Array(result.data), {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
        'Cache-Control': 'no-store',
        'X-Guest-Image-Remaining': String(Math.max(0, IMAGE_LIMIT - counts.imageCount)),
        'X-Guest-Document-Remaining': String(Math.max(0, DOCUMENT_LIMIT - counts.documentCount)),
      },
    });
    if (isNewVisitor)
      response.cookies.set(COOKIE, visitor, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 32,
        path: '/',
      });
    return response;
  } catch (error) {
    await prisma.guestConversionQuota.update({
      where: { id: quota.id },
      data:
        kind === 'image' ? { imageCount: { decrement: 1 } } : { documentCount: { decrement: 1 } },
    });
    return NextResponse.json(
      {
        error:
          error instanceof CoreConversionError
            ? error.message
            : 'Unable to convert the source file.',
      },
      { status: 422 },
    );
  }
}

function conversionKind(mimeType: string, targetFormat: string) {
  if (
    (mimeType === 'image/jpeg' || mimeType === 'image/png') &&
    ['jpg', 'png'].includes(targetFormat)
  )
    return 'image' as const;
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
    targetFormat === 'pdf'
  )
    return 'document' as const;
  return null;
}

async function quotaExceeded(kind: 'image' | 'document', quotaId: string) {
  const counts = await prisma.guestConversionQuota.findUniqueOrThrow({
    where: { id: quotaId },
    select: { imageCount: true, documentCount: true },
  });
  return NextResponse.json(
    {
      error: `Monthly ${kind} guest limit reached.`,
      remainingImage: Math.max(0, IMAGE_LIMIT - counts.imageCount),
      remainingDocument: Math.max(0, DOCUMENT_LIMIT - counts.documentCount),
    },
    { status: 429 },
  );
}

function quotaResponse(counts: { imageCount: number; documentCount: number }) {
  return NextResponse.json(
    {
      remainingImage: Math.max(0, IMAGE_LIMIT - counts.imageCount),
      remainingDocument: Math.max(0, DOCUMENT_LIMIT - counts.documentCount),
      resetsAt: nextPeriodStart().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

function currentPeriodStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
function nextPeriodStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
function visitorHash(visitor: string) {
  return createHash('sha256').update(visitor).digest('hex');
}

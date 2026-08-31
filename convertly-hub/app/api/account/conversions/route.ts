import { after, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getCurrentSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  ConversionQuotaExceededError,
  createConversionRequest,
  getSessionConversionPrincipal,
  isMultipartFormData,
  validateConversionRequest,
} from '@/lib/api/conversion-request';
import { getPlanDefinition } from '@/lib/billing/plans';
import { CoreConversionError, validateCoreConversion } from '@/lib/core/conversion';
import { processConversionJob } from '@/lib/core/conversion-job';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const HISTORY_PAGE_SIZE = 10;
const historySortFields = [
  'sourceFileName',
  'targetFormat',
  'status',
  'expiresAt',
  'createdAt',
] as const;
type HistorySortField = (typeof historySortFields)[number];

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const cursor = searchParams.get('cursor');
  const search = searchParams.get('search')?.trim().slice(0, 100) ?? '';
  const sortField = parseHistorySortField(searchParams.get('sort'));
  const sortDirection = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';
  const now = new Date();
  const billingPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const where: Prisma.ConversionLogWhereInput = {
    userId: session.user.id,
    createdAt: { gte: billingPeriodStart },
    ...(search ? { sourceFileName: { contains: search, mode: 'insensitive' } } : {}),
  };
  const orderBy: Prisma.ConversionLogOrderByWithRelationInput[] = [
    { [sortField]: sortDirection },
    { id: sortDirection },
  ];
  const [rows, total] = await Promise.all([
    prisma.conversionLog.findMany({
      where,
      select: {
        id: true,
        sourceFileName: true,
        sourceMimeType: true,
        targetFormat: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        storageKey: true,
      },
      orderBy,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: HISTORY_PAGE_SIZE + 1,
    }),
    prisma.conversionLog.count({ where }),
  ]);
  const hasNextPage = rows.length > HISTORY_PAGE_SIZE;
  const conversions = hasNextPage ? rows.slice(0, HISTORY_PAGE_SIZE) : rows;
  const nextCursor = hasNextPage ? (conversions.at(-1)?.id ?? null) : null;
  return NextResponse.json(
    { conversions, nextCursor, total },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

function parseHistorySortField(value: string | null): HistorySortField {
  return historySortFields.includes(value as HistorySortField)
    ? (value as HistorySortField)
    : 'createdAt';
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return unauthorized();

  const principal = await getSessionConversionPrincipal(session.user.id);
  if (!principal) return unauthorized();

  if (!isMultipartFormData(request.headers.get('content-type'))) {
    return NextResponse.json(
      { error: 'Content-Type must be multipart/form-data.' },
      { status: 415 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const targetFormat = formData.get('targetFormat');
  if (!(file instanceof File) || typeof targetFormat !== 'string') {
    return NextResponse.json(
      { error: 'Fields file and targetFormat are required.' },
      { status: 400 },
    );
  }

  const validation = validateConversionRequest(
    { file, targetFormat },
    getPlanDefinition(principal.plan ?? 'FREE').maxFileSizeBytes,
  );
  if ('error' in validation) return conversionValidationError(validation.error);

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
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INVALID_FILE' ? 415 : 422 },
      );
    }
    return NextResponse.json({ error: 'Unable to validate source file.' }, { status: 400 });
  }

  let created;
  try {
    created = await createConversionRequest(principal, {
      file,
      targetFormat: validation.targetFormat,
      sourceFileHash: createHash('sha256').update(fileData).digest('hex'),
      reuseStoredResult: true,
    });
  } catch (error) {
    if (error instanceof ConversionQuotaExceededError) {
      return NextResponse.json(
        { error: 'Monthly conversion limit reached for the active plan.' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: 'Unable to create conversion request.' }, { status: 503 });
  }
  if ('error' in created) return conversionValidationError(created.error);
  if ('existingConversion' in created) {
    return NextResponse.json(
      { status: 'AVAILABLE', conversionId: created.existingConversion.id },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const job = {
    conversionId: created.conversion.id,
    data: fileData,
    sourceFileName: file.name,
    sourceMimeType: file.type,
    targetFormat: validation.targetFormat,
    userId: principal.userId,
    storeResult: principal.storeConversions,
    plan: principal.plan ?? 'FREE',
  };

  if (!principal.storeConversions) {
    const converted = await processConversionJob(job);
    if (!converted)
      return NextResponse.json({ error: 'Unable to convert the source file.' }, { status: 422 });

    return new Response(new Uint8Array(converted.data), {
      headers: {
        'Content-Type': converted.mimeType,
        'Content-Disposition': contentDisposition(converted.fileName),
        'Cache-Control': 'no-store',
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
    { status: 202, headers: { 'Cache-Control': 'no-store' } },
  );
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

function contentDisposition(fileName: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function conversionValidationError(
  error: 'FILE_TOO_LARGE' | 'UNSUPPORTED_FILE' | 'UNSUPPORTED_TARGET_FORMAT',
) {
  switch (error) {
    case 'FILE_TOO_LARGE':
      return NextResponse.json({ error: 'File exceeds the active plan limit.' }, { status: 413 });
    case 'UNSUPPORTED_FILE':
      return NextResponse.json({ error: 'Unsupported source file.' }, { status: 415 });
    case 'UNSUPPORTED_TARGET_FORMAT':
      return NextResponse.json({ error: 'Unsupported target format.' }, { status: 422 });
  }
}

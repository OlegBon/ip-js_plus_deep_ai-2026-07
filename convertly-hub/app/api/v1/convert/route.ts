import { after, NextResponse } from 'next/server';
import {
  authenticateApiKey,
  ConversionQuotaExceededError,
  createConversionRequest,
  isMultipartFormData,
  validateConversionRequest,
} from '@/lib/api/conversion-request';
import { CoreConversionError, validateCoreConversion } from '@/lib/core/conversion';
import { processConversionJob } from '@/lib/core/conversion-job';
import { consumeApiKeyRateLimit } from '@/lib/api/rate-limit';
import { getPlanDefinition } from '@/lib/billing/plans';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const principal = await authenticateApiKey(request.headers.get('authorization'));
  if (!principal) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!principal.apiKeyId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!getPlanDefinition(principal.plan ?? 'FREE').apiAccess) {
    return NextResponse.json(
      { error: 'API access requires a Basic plan or higher.' },
      { status: 403 },
    );
  }

  const rateLimit = consumeApiKeyRateLimit(principal.apiKeyId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many conversion requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }

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

  const requestValidation = validateConversionRequest({ file, targetFormat });
  if ('error' in requestValidation) {
    return conversionValidationError(requestValidation.error);
  }

  const fileData = Buffer.from(await file.arrayBuffer());
  try {
    validateCoreConversion({
      data: fileData,
      sourceFileName: file.name,
      sourceMimeType: file.type,
      targetFormat: requestValidation.targetFormat,
    });
  } catch (error) {
    if (error instanceof CoreConversionError) {
      const status = error.code === 'INVALID_FILE' ? 415 : 422;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to validate source file.' }, { status: 400 });
  }

  let result;
  try {
    result = await createConversionRequest(principal, {
      file,
      targetFormat: requestValidation.targetFormat,
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
  if ('error' in result) {
    return conversionValidationError(result.error);
  }
  if ('existingConversion' in result) {
    return NextResponse.json({ error: 'Unable to create conversion request.' }, { status: 503 });
  }

  const job = {
    conversionId: result.conversion.id,
    data: fileData,
    sourceFileName: file.name,
    sourceMimeType: file.type,
    targetFormat: requestValidation.targetFormat,
    userId: principal.userId,
    storeResult: principal.storeConversions,
    plan: principal.plan ?? 'FREE',
  };

  if (!principal.storeConversions) {
    const converted = await processConversionJob(job);
    if (!converted) {
      return NextResponse.json({ error: 'Unable to convert the source file.' }, { status: 422 });
    }

    return new Response(new Uint8Array(converted.data), {
      status: 200,
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

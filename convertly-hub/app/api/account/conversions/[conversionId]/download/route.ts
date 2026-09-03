import { NextResponse } from 'next/server';
import { getSessionConversionPrincipal } from '@/lib/api/conversion-request';
import { getCurrentSession } from '@/lib/auth/session';
import {
  StoredConversionNotFoundError,
  downloadStoredConversion,
} from '@/lib/privacy/conversion-results';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ conversionId: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return unauthorized();

  const principal = await getSessionConversionPrincipal(session.user.id);
  if (!principal) return unauthorized();

  const { conversionId } = await params;
  try {
    const result = await downloadStoredConversion({ conversionId, userId: principal.userId });
    return new Response(result.body, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': contentDisposition(result.fileName),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof StoredConversionNotFoundError) {
      const conversion = await prisma.conversionLog.findFirst({
        where: { id: conversionId, userId: principal.userId },
        select: { status: true, errorMessage: true },
      });
      if (conversion?.status === 'PENDING' || conversion?.status === 'PROCESSING') {
        return NextResponse.json(
          { error: 'Conversion is still processing.' },
          { status: 409, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      if (conversion?.status === 'FAILED') {
        return NextResponse.json(
          {
            error:
              conversion.errorMessage ?? 'Conversion failed. Check the source file and try again.',
          },
          { status: 422, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      return NextResponse.json({ error: 'Stored conversion not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Unable to download stored conversion.' }, { status: 503 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

function contentDisposition(fileName: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

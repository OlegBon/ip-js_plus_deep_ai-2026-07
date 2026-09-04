'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import FileDropzone from '@/components/core/FileDropzone';
import GuestConversionSummary from '@/components/core/GuestConversionSummary';
import { Button } from '@/components/ui/Button';
import {
  BROWSER_DOCUMENT_FILE_ACCEPT,
  IMAGE_FILE_ACCEPT,
  MAX_UPLOAD_SIZE_LABEL,
} from '@/lib/files/upload-policy';
import {
  loadGuestConversionResults,
  expireGuestConversionResult,
  saveGuestConversionResult,
  type GuestConversionResult,
} from '@/lib/client/guest-conversion-cache';

const conversionTargets: Record<string, { format: string; extension: string }> = {
  'image/jpeg': { format: 'png', extension: 'png' },
  'image/png': { format: 'jpg', extension: 'jpg' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    format: 'pdf',
    extension: 'pdf',
  },
};

function conversionSuccessMessage(file: File) {
  return `${file.name} was converted and downloaded successfully.`;
}

export default function Home() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [guestQuota, setGuestQuota] = useState({
    image: 3,
    document: 2,
    resetsAt: null as string | null,
    supportCode: null as string | null,
  });
  const [guestResults, setGuestResults] = useState<GuestConversionResult[]>([]);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (isAuthenticated) return;
    const controller = new AbortController();
    fetch('/api/guest/conversions', { cache: 'no-store', signal: controller.signal })
      .then(async (response) =>
        response.ok
          ? (response.json() as Promise<{
              remainingImage: number;
              remainingDocument: number;
              resetsAt?: string;
              supportCode?: string | null;
            }>)
          : null,
      )
      .then((quota) => {
        if (quota)
          setGuestQuota({
            image: quota.remainingImage,
            document: quota.remainingDocument,
            resetsAt: quota.resetsAt ?? null,
            supportCode: quota.supportCode ?? null,
          });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated) return;
    let active = true;
    loadGuestConversionResults()
      .then((results) => {
        if (!active) return;
        setNow(Date.now());
        setGuestResults(results);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuthenticated]);
  useEffect(() => {
    if (!guestResults.some((result) => result.blob !== null && result.expiresAt > Date.now()))
      return;
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setGuestResults((results) => {
        const updatedResults = results.map((result) => {
          if (result.expiresAt > currentTime || result.blob === null) return result;
          void expireGuestConversionResult(result);
          return { ...result, blob: null };
        });
        return updatedResults;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [guestResults.length]);

  const handleUpload = useCallback(
    async (file: File) => {
      const target = conversionTargets[file.type];
      if (!target) throw new Error('This file type cannot be converted from the browser.');

      const formData = new FormData();
      formData.set('file', file);
      formData.set('targetFormat', target.format);

      const response = await fetch(
        status === 'authenticated' ? '/api/account/conversions' : '/api/guest/conversions',
        { method: 'POST', body: formData },
      );
      if (!response.ok) throw new Error(await responseError(response));

      if (
        response.status === 200 &&
        response.headers.get('content-type')?.includes('application/json')
      ) {
        const existingConversion = await existingConversionId(response);
        if (existingConversion) return { kind: 'already-available' as const };
      }

      const resultResponse =
        response.status === 202
          ? await waitForStoredResult(await conversionId(response))
          : response;
      const blob = await resultResponse.blob();
      const fileName = resultFileName(file.name, target.extension);
      downloadResult(blob, fileName);
      if (!isAuthenticated) {
        const guestResult = {
          id: crypto.randomUUID(),
          blob,
          fileName,
          expiresAt: Date.now() + 10 * 60 * 1000,
        };
        setGuestQuota({
          image: Number(resultResponse.headers.get('X-Guest-Image-Remaining') ?? guestQuota.image),
          document: Number(
            resultResponse.headers.get('X-Guest-Document-Remaining') ?? guestQuota.document,
          ),
          resetsAt: guestQuota.resetsAt,
          supportCode: resultResponse.headers.get('X-Guest-Support-Code') ?? guestQuota.supportCode,
        });
        await saveGuestConversionResult(guestResult);
        setNow(Date.now());
        setGuestResults((results) => [guestResult, ...results]);
      }
      return { kind: 'converted' as const };
    },
    [guestQuota, isAuthenticated, status],
  );
  function downloadGuestResult(result: GuestConversionResult) {
    if (result.blob === null || result.expiresAt <= Date.now()) return;
    downloadResult(result.blob, result.fileName);
  }

  return (
    <div className="flex flex-grow flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="container mx-auto px-4">
        <section className="mb-12 text-center">
          <h1 className="text-text-primary mb-2 text-4xl font-bold">Seamless File Conversion</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            {isAuthenticated
              ? 'Convert JPG, PNG, and DOCX files securely from your Convertly Hub account.'
              : 'Try Convertly without an account: 3 image and 2 document conversions per month. Files up to 1 MB; downloads stay only in this browser.'}
          </p>
        </section>

        {status === 'loading' ? (
          <p className="text-text-secondary text-center">Checking your session…</p>
        ) : isAuthenticated ? (
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <FileDropzone
              title="Image Converter"
              description={`JPG ↔ PNG · up to ${MAX_UPLOAD_SIZE_LABEL}`}
              accept={IMAGE_FILE_ACCEPT}
              onUpload={handleUpload}
              getSuccessMessage={conversionSuccessMessage}
            />
            <FileDropzone
              title="Document Converter"
              description={`DOCX → PDF · up to ${MAX_UPLOAD_SIZE_LABEL}`}
              accept={BROWSER_DOCUMENT_FILE_ACCEPT}
              onUpload={handleUpload}
              getSuccessMessage={conversionSuccessMessage}
            />
          </div>
        ) : (
          <>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              <FileDropzone
                title="Image Converter"
                description={
                  guestQuota.image > 0
                    ? `JPG ↔ PNG · up to 1 MB · ${guestQuota.image} left this month`
                    : 'Monthly image conversion limit reached.'
                }
                accept={IMAGE_FILE_ACCEPT}
                onUpload={handleUpload}
                disabled={guestQuota.image === 0}
                maxSize={1024 * 1024}
                maxSizeLabel="1 MB"
                getSuccessMessage={conversionSuccessMessage}
              />
              <FileDropzone
                title="Document Converter"
                description={
                  guestQuota.document > 0
                    ? `DOCX → PDF · up to 1 MB · ${guestQuota.document} left this month`
                    : 'Monthly document conversion limit reached.'
                }
                accept={BROWSER_DOCUMENT_FILE_ACCEPT}
                onUpload={handleUpload}
                disabled={guestQuota.document === 0}
                maxSize={1024 * 1024}
                maxSizeLabel="1 MB"
                getSuccessMessage={conversionSuccessMessage}
              />
            </div>
            <GuestConversionSummary
              remainingImage={guestQuota.image}
              remainingDocument={guestQuota.document}
              resetsAt={guestQuota.resetsAt}
              supportCode={guestQuota.supportCode}
              results={guestResults}
              now={now}
              onDownload={downloadGuestResult}
            />
            <div className="mt-8 text-center">
              <Button asChild variant="secondary">
                <Link href="/register">Create a free account for more conversions</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    // Keep a safe generic message for malformed error responses.
  }
  return 'Unable to convert the file. Please try again.';
}

async function conversionId(response: Response) {
  const body = (await response.json()) as { conversionId?: unknown };
  if (typeof body.conversionId !== 'string')
    throw new Error('Conversion request did not return an identifier.');
  return body.conversionId;
}

async function existingConversionId(response: Response) {
  const body = (await response.json()) as { status?: unknown; conversionId?: unknown };
  return body.status === 'AVAILABLE' && typeof body.conversionId === 'string'
    ? body.conversionId
    : null;
}

async function waitForStoredResult(conversionId: string) {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    const response = await fetch(
      `/api/account/conversions/${encodeURIComponent(conversionId)}/download`,
      { cache: 'no-store' },
    );
    if (response.ok) return response;
    if (response.status !== 409) throw new Error(await responseError(response));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    'The conversion is taking longer than expected. Please check your history shortly.',
  );
}

function resultFileName(sourceFileName: string, extension: string) {
  const baseName = sourceFileName.replace(/\.[^.]+$/, '') || 'converted';
  return `${baseName}.${extension}`;
}

function downloadResult(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

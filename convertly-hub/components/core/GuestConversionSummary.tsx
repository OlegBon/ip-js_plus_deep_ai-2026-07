'use client';

import { useState } from 'react';
import type { GuestConversionResult } from '@/lib/client/guest-conversion-cache';

type Props = {
  remainingImage: number;
  remainingDocument: number;
  resetsAt: string | null;
  supportCode?: string | null;
  results: GuestConversionResult[];
  now: number;
  onDownload: (result: GuestConversionResult) => void;
};

export default function GuestConversionSummary({
  remainingImage,
  remainingDocument,
  resetsAt,
  supportCode = null,
  results,
  now,
  onDownload,
}: Props) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopySupportCode() {
    if (!supportCode || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(supportCode);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <section
      className="mx-auto mt-6 max-w-4xl rounded-lg border border-border bg-white p-6"
      aria-labelledby="guest-usage-title"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="guest-usage-title" className="text-lg font-semibold text-text-primary">
          Guest conversion allowance
        </h2>
        <p className="text-sm text-text-secondary">
          No account or server-side file storage required.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="rounded-md bg-background-secondary p-3 text-sm text-text-primary">
          Images: {remainingImage} of 3 remaining this month
        </p>
        <p className="rounded-md bg-background-secondary p-3 text-sm text-text-primary">
          Documents: {remainingDocument} of 2 remaining this month
        </p>
      </div>
      <p className="mt-3 text-sm text-text-secondary">
        {resetsAt
          ? `Allowance resets on ${new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(resetsAt))}.`
          : 'Allowance resets on the first day of next month.'}
      </p>
      {supportCode && (
        <div className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-background-secondary p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-text-primary">Guest support code</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Share it with support if you need help with this browser&apos;s monthly allowance.
            </p>
          </div>
          <div className="flex flex-col gap-2 self-start sm:flex-row sm:items-center sm:self-auto">
            <code className="self-start whitespace-nowrap rounded bg-white px-2 py-1 text-sm font-medium tracking-wide text-text-primary">
              {supportCode}
            </code>
            <button
              className="rounded-md border border-border bg-white px-3 py-1 text-sm font-medium text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              type="button"
              onClick={handleCopySupportCode}
            >
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      <div className="mt-5 border-t border-border pt-4">
        <h3 className="font-medium text-text-primary">Guest conversions ({results.length})</h3>
        {results.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            Converted guest files will appear here for 10 minutes in this browser.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {results.map((result) => (
              <li
                key={result.id}
                className="flex flex-col gap-2 rounded-md bg-background-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                {canDownload(result, now) ? (
                  <button
                    className="break-all text-left text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent"
                    type="button"
                    onClick={() => onDownload(result)}
                  >
                    {result.fileName}
                  </button>
                ) : (
                  <span className="break-all text-sm text-text-primary">{result.fileName}</span>
                )}
                <span className="text-sm text-text-secondary">
                  {canDownload(result, now)
                    ? `Available for ${remainingMinutes(result.expiresAt, now)} min`
                    : 'Unavailable — download window expired.'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function remainingMinutes(expiresAt: number, now: number) {
  return Math.max(1, Math.ceil((expiresAt - now) / 60_000));
}

function canDownload(result: GuestConversionResult, now: number) {
  return result.blob !== null && result.expiresAt > now;
}

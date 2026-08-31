'use client';

import { useEffect, useState } from 'react';

const sourceFormatLabels: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

type Conversion = {
  id: string;
  sourceFileName: string;
  sourceMimeType: string;
  targetFormat: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  expiresAt: string | null;
  storageKey: string | null;
};

function sourceFormat(conversion: Conversion) {
  return sourceFormatLabels[conversion.sourceMimeType] ?? conversion.sourceMimeType.toUpperCase();
}

function canDownload(conversion: Conversion) {
  return (
    conversion.status === 'COMPLETED' &&
    conversion.storageKey !== null &&
    (conversion.expiresAt === null || new Date(conversion.expiresAt).getTime() > Date.now())
  );
}

function availability(conversion: Conversion) {
  if (!conversion.storageKey) return 'Not stored';
  if (!conversion.expiresAt) return 'No automatic deletion';
  const milliseconds = new Date(conversion.expiresAt).getTime() - Date.now();
  if (milliseconds <= 0) return 'Expired — file will be removed';
  const hours = Math.ceil(milliseconds / (60 * 60 * 1000));
  return `Available for ${hours < 48 ? `${hours}h` : `${Math.ceil(hours / 24)} days`}`;
}

export default function ConversionHistory() {
  const [conversions, setConversions] = useState<Conversion[] | null>(null);
  useEffect(() => {
    fetch('/api/account/conversions')
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload) => setConversions(payload?.conversions ?? []))
      .catch(() => setConversions([]));
  }, []);
  if (!conversions)
    return <div className="rounded-lg bg-white p-6 shadow-md">Loading conversion history…</div>;
  return (
    <div className="overflow-x-auto rounded-lg bg-white p-6 shadow-md">
      <table className="min-w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Conversion</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Availability</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((conversion) => (
            <tr key={conversion.id} className="border-b">
              <td className="px-4 py-3 font-medium text-gray-900">
                {canDownload(conversion) ? (
                  <a
                    className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    href={`/api/account/conversions/${encodeURIComponent(conversion.id)}/download`}
                  >
                    {conversion.sourceFileName}
                  </a>
                ) : (
                  conversion.sourceFileName
                )}
              </td>
              <td className="px-4 py-3">
                {sourceFormat(conversion)} → {conversion.targetFormat.toUpperCase()}
              </td>
              <td className="px-4 py-3">{conversion.status}</td>
              <td className="px-4 py-3" title={conversion.expiresAt ?? undefined}>
                {availability(conversion)}
              </td>
            </tr>
          ))}
          {conversions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center">
                No conversions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import ConfirmationModal from '@/components/core/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/hooks/use-toast';

type DeletionRequest = {
  id: string;
  userEmail: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  processingStartedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  processedByEmail: string | null;
  events: { id: string; type: string; actorEmail: string | null; createdAt: string }[];
};

export default function AccountDeletionRequests() {
  const [requests, setRequests] = useState<DeletionRequest[] | null>(null);
  const [selected, setSelected] = useState<DeletionRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch('/api/admin/account-deletion-requests', { signal });
    if (!response.ok) throw new Error('Unable to load deletion requests.');
    const payload = (await response.json()) as { requests: DeletionRequest[] };
    setRequests(payload.requests);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal).catch((error: unknown) => {
      if ((error as { name?: string }).name !== 'AbortError') setRequests([]);
    });
    return () => controller.abort();
  }, [refresh]);

  function processRequest() {
    if (!selected) return;
    const request = selected;
    startTransition(async () => {
      const response = await fetch(`/api/admin/account-deletion-requests/${request.id}`, {
        method: 'POST',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to process the deletion request.');
        return;
      }
      setSelected(null);
      await refresh();
      toast.success('Account deletion completed.');
    });
  }

  const actionLabel = selected?.status === 'FAILED' ? 'Retry deletion' : 'Delete account';
  return (
    <section className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {requests ? `${requests.length} recent requests` : 'Loading deletion requests…'}
        </p>
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      <div className="space-y-3">
        {requests?.map((request) => {
          const actionable = request.status === 'PENDING' || request.status === 'FAILED';
          return (
            <article key={request.id} className="rounded-md border p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="break-all font-medium text-gray-900">{request.userEmail}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Requested {new Date(request.requestedAt).toLocaleString()} · {request.status}
                  </p>
                  {request.processedByEmail && (
                    <p className="mt-1 text-sm text-gray-500">
                      Processed by {request.processedByEmail}
                    </p>
                  )}
                  {request.failureReason && (
                    <p className="mt-1 text-sm text-red-700">{request.failureReason}</p>
                  )}
                </div>
                {actionable && (
                  <Button size="sm" disabled={isPending} onClick={() => setSelected(request)}>
                    {request.status === 'FAILED' ? 'Retry' : 'Confirm deletion'}
                  </Button>
                )}
              </div>
              <details className="mt-3 text-sm text-gray-500">
                <summary className="cursor-pointer">Audit trail ({request.events.length})</summary>
                <ul className="mt-2 space-y-1">
                  {request.events.map((event) => (
                    <li key={event.id}>
                      {event.type} · {new Date(event.createdAt).toLocaleString()}
                      {event.actorEmail ? ` · ${event.actorEmail}` : ''}
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          );
        })}
        {requests?.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No deletion requests.</p>
        )}
      </div>
      {selected && (
        <ConfirmationModal
          isOpen
          onClose={() => setSelected(null)}
          onConfirm={processRequest}
          title={selected.status === 'FAILED' ? 'Retry account deletion?' : 'Delete this account?'}
          message={`This permanently removes ${selected.userEmail}, its API keys, conversion records and stored conversion files. This cannot be undone.`}
          confirmLabel={actionLabel}
          isPending={isPending}
        />
      )}
    </section>
  );
}

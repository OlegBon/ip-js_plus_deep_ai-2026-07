'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import ConfirmationModal from '@/components/core/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { CursorPagination } from '@/components/ui/CursorPagination';
import Search from '@/components/ui/Search';
import { toast } from '@/lib/hooks/use-toast';

type Status = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type DeletionRequest = {
  id: string;
  userEmail: string;
  status: Status;
  requestedAt: string;
  failureReason: string | null;
  processedByEmail: string | null;
  cancelledByEmail: string | null;
  events: { id: string; type: string; actorEmail: string | null; createdAt: string }[];
};
type Result = { requests: DeletionRequest[]; nextCursor: string | null; total: number };
type PendingAction = { type: 'process' | 'cancel'; request: DeletionRequest } | null;
const PAGE_SIZE = 10;

type AccountDeletionRequestsProps = {
  onDeletionCompleted: () => void;
};

export default function AccountDeletionRequests({
  onDeletionCompleted,
}: AccountDeletionRequestsProps) {
  const [result, setResult] = useState<Result | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status | 'ALL'>('ALL');
  const [cursor, setCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (query) params.set('query', query);
    if (status !== 'ALL') params.set('status', status);
    if (cursor) params.set('cursor', cursor);
    return `/api/admin/account-deletion-requests?${params}`;
  }, [cursor, query, status]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error();
      setResult((await response.json()) as Result);
      setLastUpdatedAt(new Date());
    } catch {
      toast.error('Unable to refresh deletion requests.');
    } finally {
      setIsRefreshing(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(buildUrl(), { signal: controller.signal })
      .then(async (response) => (response.ok ? (response.json() as Promise<Result>) : null))
      .then((payload) => {
        setResult(payload ?? { requests: [], nextCursor: null, total: 0 });
        if (payload) setLastUpdatedAt(new Date());
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError')
          setResult({ requests: [], nextCursor: null, total: 0 });
      });
    return () => controller.abort();
  }, [buildUrl]);

  function resetPagination() {
    setCursor(null);
    setPreviousCursors([]);
  }
  function applySearch(value: string) {
    setQuery(value.trim());
    resetPagination();
  }
  function changeStatus(value: Status | 'ALL') {
    setStatus(value);
    resetPagination();
  }
  function confirmPendingAction() {
    if (!pendingAction) return;
    const action = pendingAction;
    startTransition(async () => {
      const response = await fetch(
        action.type === 'process'
          ? `/api/admin/account-deletion-requests/${action.request.id}`
          : `/api/admin/account-deletion-requests?requestId=${encodeURIComponent(action.request.id)}`,
        { method: action.type === 'process' ? 'POST' : 'DELETE' },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to update the deletion request.');
        return;
      }
      setPendingAction(null);
      await refresh();
      if (action.type === 'process') onDeletionCompleted();
      toast.success(
        action.type === 'process' ? 'Account deletion completed.' : 'Deletion request cancelled.',
      );
    });
  }

  const requests = result?.requests ?? [];
  const page = previousCursors.length + 1;
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  const confirmation = pendingAction && getConfirmationDetails(pendingAction);
  return (
    <section className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {result ? `${result.total} requests` : 'Loading deletion requests…'}
          {lastUpdatedAt && ` · Updated ${lastUpdatedAt.toLocaleString()}`}
        </p>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending || isRefreshing}
          onClick={() => void refresh()}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Search
          className="w-full max-w-md"
          aria-label="Search deletion requests"
          value={queryInput}
          onValueChange={setQueryInput}
          onSearch={applySearch}
          placeholder="Search by account email"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Status
          <select
            value={status}
            onChange={(event) => changeStatus(event.target.value as Status | 'ALL')}
            className="rounded-md border border-gray-300 bg-white px-2 py-2"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
      </div>
      <div className="space-y-3">
        {requests.map((request) => {
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
                  {request.cancelledByEmail && (
                    <p className="mt-1 text-sm text-gray-500">
                      Cancelled by {request.cancelledByEmail}
                    </p>
                  )}
                  {request.failureReason && (
                    <p className="mt-1 text-sm text-red-700">{request.failureReason}</p>
                  )}
                </div>
                {actionable && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => setPendingAction({ type: 'process', request })}
                    >
                      {request.status === 'FAILED' ? 'Retry' : 'Confirm deletion'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => setPendingAction({ type: 'cancel', request })}
                    >
                      Cancel
                    </Button>
                  </div>
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
        {result && requests.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No deletion requests found.</p>
        )}
      </div>
      <CursorPagination
        page={page}
        totalPages={pages}
        canGoPrevious={previousCursors.length > 0}
        canGoNext={Boolean(result?.nextCursor)}
        disabled={isPending || isRefreshing}
        onPrevious={() => {
          const history = [...previousCursors];
          setCursor(history.pop() ?? null);
          setPreviousCursors(history);
        }}
        onNext={() => {
          if (result?.nextCursor) {
            setPreviousCursors((history) => [...history, cursor ?? '']);
            setCursor(result.nextCursor);
          }
        }}
      />
      {confirmation && (
        <ConfirmationModal
          isOpen
          onClose={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          isPending={isPending}
        />
      )}
    </section>
  );
}

function getConfirmationDetails(action: Exclude<PendingAction, null>) {
  if (action.type === 'cancel')
    return {
      title: 'Cancel deletion request?',
      message: `${action.request.userEmail} will keep access and no account data will be removed.`,
      confirmLabel: 'Cancel request',
    };
  return {
    title: action.request.status === 'FAILED' ? 'Retry account deletion?' : 'Delete this account?',
    message: `This permanently removes ${action.request.userEmail}, its API keys, conversion records and stored conversion files. This cannot be undone.`,
    confirmLabel: action.request.status === 'FAILED' ? 'Retry deletion' : 'Delete account',
  };
}

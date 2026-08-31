'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { CursorPagination } from '@/components/ui/CursorPagination';
import Search from '@/components/ui/Search';
import { toast } from '@/lib/hooks/use-toast';

type ApiKey = { id: string; name: string; keyPrefix: string };
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  plan: string;
  lastLoginAt: string | null;
  apiKeys: ApiKey[];
};
type SortField = 'createdAt' | 'email' | 'role' | 'plan' | 'status' | 'lastLoginAt';
type UsersResponse = { users: User[]; nextCursor: string | null; total: number };

const PAGE_SIZE = 10;

export default function UserManagement() {
  const [result, setResult] = useState<UsersResponse | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);
  const [sort, setSort] = useState<SortField>('createdAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), sort, direction });
    if (query) params.set('query', query);
    if (cursor) params.set('cursor', cursor);

    fetch(`/api/admin/users?${params}`, { signal: controller.signal })
      .then(async (response) => (response.ok ? (response.json() as Promise<UsersResponse>) : null))
      .then((payload) => setResult(payload ?? { users: [], nextCursor: null, total: 0 }))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError') {
          setResult({ users: [], nextCursor: null, total: 0 });
        }
      });

    return () => controller.abort();
  }, [cursor, direction, query, sort]);

  const applySearch = useCallback((value: string) => {
    setCursor(null);
    setPreviousCursors([]);
    setQuery(value.trim());
  }, []);

  function changeSort(field: SortField) {
    setDirection((current) => (sort === field ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSort(field);
    setCursor(null);
    setPreviousCursors([]);
  }

  async function updateStatus(user: User) {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        toast.error('Unable to update user status.');
        return;
      }
      setResult(
        (current) =>
          current && {
            ...current,
            users: current.users.map((item) =>
              item.id === user.id ? { ...item, status: nextStatus } : item,
            ),
          },
      );
      toast.success(`User ${nextStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`);
    });
  }

  async function revokeKey(key: ApiKey) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/api-keys/${key.id}`, { method: 'DELETE' });
      if (!response.ok) {
        toast.error('Unable to revoke API key.');
        return;
      }
      setResult(
        (current) =>
          current && {
            ...current,
            users: current.users.map((user) => ({
              ...user,
              apiKeys: user.apiKeys.filter((item) => item.id !== key.id),
            })),
          },
      );
      toast.success('API key revoked.');
    });
  }

  const users = result?.users ?? [];
  const page = previousCursors.length + 1;
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  return (
    <section className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">
            {result ? `${result.total} users` : 'Loading users…'}
          </p>
        </div>
        <Search
          className="w-full max-w-md sm:w-auto"
          aria-label="Search users"
          value={queryInput}
          onValueChange={setQueryInput}
          onSearch={applySearch}
          placeholder="Search by name or email"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-gray-500">
            <tr>
              <SortableHeader
                label="User"
                field="email"
                sort={sort}
                direction={direction}
                onSort={changeSort}
              />
              <SortableHeader
                label="Role / plan"
                field="role"
                sort={sort}
                direction={direction}
                onSort={changeSort}
              />
              <SortableHeader
                label="Status"
                field="status"
                sort={sort}
                direction={direction}
                onSort={changeSort}
              />
              <SortableHeader
                label="Last login"
                field="lastLoginAt"
                sort={sort}
                direction={direction}
                onSort={changeSort}
              />
              <th className="px-3 py-3">Actions</th>
              <th className="px-3 py-3">API keys</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-3 py-4">
                  <p className="font-medium text-gray-900">{user.name || 'Unnamed user'}</p>
                  <p className="text-gray-500">{user.email}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  {user.role} · {user.plan}
                </td>
                <td className="px-3 py-4">
                  <span className={user.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'}>
                    {user.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-3 py-4">
                  <Button
                    size="sm"
                    variant={user.status === 'ACTIVE' ? 'primary' : 'secondary'}
                    disabled={isPending}
                    onClick={() => void updateStatus(user)}
                  >
                    {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </Button>
                </td>
                <td className="min-w-48 px-3 py-4">
                  {user.apiKeys.length ? (
                    <div className="space-y-2">
                      {user.apiKeys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {key.name} ({key.keyPrefix}…)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => void revokeKey(key)}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No active keys</span>
                  )}
                </td>
              </tr>
            ))}
            {result && users.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={6}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CursorPagination
        page={page}
        totalPages={pages}
        canGoPrevious={previousCursors.length > 0}
        canGoNext={Boolean(result?.nextCursor)}
        disabled={isPending}
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
    </section>
  );
}

function SortableHeader({
  label,
  field,
  sort,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  direction: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) {
  return (
    <th className="px-3 py-3">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-gray-900"
      >
        {label}
        {sort === field && (
          <span aria-label={direction === 'asc' ? 'ascending' : 'descending'}>
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    </th>
  );
}

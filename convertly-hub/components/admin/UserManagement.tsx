"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/Button";
import Search from "@/components/ui/Search";

type User = { id: string; name: string | null; email: string; role: "USER" | "ADMIN"; status: "ACTIVE" | "SUSPENDED"; plan: string; lastLoginAt: string | null; apiKeys: { id: string; name: string; keyPrefix: string }[] };
type UsersResponse = { users: User[]; nextCursor: string | null };

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]); const [query, setQuery] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null); const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const loadUsers = useCallback(async (search = "", cursor?: string, append = false) => {
    setIsLoading(true); const params = new URLSearchParams({ limit: "20" }); if (search) params.set("query", search); if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/admin/users?${params}`, { cache: "no-store" }); const payload = await response.json() as UsersResponse | { error?: string };
    if (!response.ok || !("users" in payload)) { toast.error("Unable to load users."); setIsLoading(false); return; }
    setUsers((current) => append ? [...current, ...payload.users] : payload.users); setNextCursor(payload.nextCursor); setIsLoading(false);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void loadUsers(); }, 0); return () => window.clearTimeout(timer); }, [loadUsers]);
  function handleSearch(value: string) { setQuery(value); void loadUsers(value); }
  function updateStatus(user: User, status: User["status"]) { startTransition(async () => { const response = await fetch(`/api/admin/users/${user.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) { const body = await response.json() as { error?: string }; toast.error(body.error ?? "Unable to update user."); return; } setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status } : item)); toast.success(`${user.email} is now ${status.toLowerCase()}.`); }); }
  function revokeKey(user: User, keyId: string) { startTransition(async () => { const response = await fetch(`/api/admin/api-keys/${keyId}`, { method: "DELETE" }); if (!response.ok) { toast.error("Unable to revoke API key."); return; } setUsers((current) => current.map((item) => item.id === user.id ? { ...item, apiKeys: item.apiKeys.filter((key) => key.id !== keyId) } : item)); toast.success("API key revoked."); }); }
  return <div className="rounded-lg bg-white p-6 shadow-md"><div className="mb-4 flex items-center justify-between gap-4"><Search placeholder="Search users..." onSearch={handleSearch} className="w-full max-w-xs" /><span className="text-sm text-gray-500">{isLoading ? "Loading…" : `${users.length} users`}</span></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm text-gray-500"><thead className="bg-gray-50 text-xs uppercase text-gray-700"><tr><th className="px-6 py-3">User</th><th className="px-6 py-3">Role / plan</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Last login</th><th className="px-6 py-3">Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b bg-white hover:bg-gray-50"><td className="px-6 py-4"><div className="font-bold text-gray-900">{user.name ?? "Unnamed user"}</div><div>{user.email}</div></td><td className="px-6 py-4">{user.role} · {user.plan}</td><td className="px-6 py-4">{user.status}</td><td className="px-6 py-4">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</td><td className="space-y-2 px-6 py-4"><Button size="sm" variant="outline" disabled={isPending || user.role === "ADMIN"} onClick={() => updateStatus(user, user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>{user.status === "ACTIVE" ? "Suspend" : "Restore"}</Button>{user.apiKeys.map((key) => <Button key={key.id} size="sm" variant="ghost" disabled={isPending} onClick={() => revokeKey(user, key.id)}>Revoke {key.name} ({key.keyPrefix})</Button>)}</td></tr>)}</tbody></table></div>{nextCursor && <Button className="mt-4" variant="outline" onClick={() => void loadUsers(query, nextCursor, true)} disabled={isLoading}>Load more</Button>}</div>;
}

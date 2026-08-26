"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clipboard, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/hooks/use-toast";

type ApiKey = { id: string; name: string; keyPrefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };

export default function ApiKeyManager() {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadApiKeys() {
      try {
        const [billing, keys] = await Promise.all([
          fetch("/api/account/billing", { signal: controller.signal }),
          fetch("/api/account/api-keys", { signal: controller.signal }),
        ]);
        const billingData = billing.ok ? await billing.json() as { activePlan: string } : null;
        setIsAllowed(billingData?.activePlan !== "FREE");
        if (keys.ok) {
          const data = await keys.json() as { apiKeys: ApiKey[] };
          setApiKeys(data.apiKeys);
        }
      } catch {
        if (!controller.signal.aborted) setIsAllowed(false);
      }
    }
    void loadApiKeys();
    return () => controller.abort();
  }, []);

  async function handleCreate() {
    const response = await fetch("/api/account/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Dashboard key" }) });
    const data = await response.json() as { apiKey?: ApiKey; secret?: string; error?: string };
    if (!response.ok || !data.apiKey || !data.secret) { toast.error(data.error ?? "Unable to create API key."); return; }
    setApiKeys((keys) => [data.apiKey!, ...keys]); setNewSecret(data.secret);
    toast.success("API key created. Copy it now; it will not be shown again.");
  }
  async function handleRevoke(id: string) {
    const response = await fetch(`/api/account/api-keys/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { toast.error("Unable to revoke API key."); return; }
    setApiKeys((keys) => keys.filter((key) => key.id !== id)); toast.success("API key revoked.");
  }
  async function copySecret() { if (newSecret) { await navigator.clipboard?.writeText(newSecret); toast.success("API key copied to clipboard."); } }

  if (isAllowed === null) return <div className="rounded-lg bg-white p-6 shadow-md">Loading API keys…</div>;
  if (!isAllowed) return <div className="rounded-lg bg-white p-6 shadow-md"><div className="flex gap-3"><KeyRound className="text-gray-500" /><div><h3 className="text-lg font-semibold">API Keys</h3><p className="mt-1 text-sm text-gray-500">API access is available from the Basic plan.</p><Link href="/pricing" className="mt-3 inline-block text-sm font-semibold text-indigo-600">View plans</Link></div></div></div>;
  return <div className="space-y-4 rounded-lg bg-white p-6 shadow-md"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Only a newly created secret can be copied. Stored keys are shown by prefix.</p><Button onClick={handleCreate}>Create key</Button></div>{newSecret && <div className="flex gap-2 rounded bg-amber-50 p-3"><code className="min-w-0 flex-1 break-all text-sm">{newSecret}</code><Button variant="outline" size="icon" aria-label="Copy API Key" onClick={copySecret}><Clipboard size={18} /></Button></div>}<ul className="divide-y">{apiKeys.map((key) => <li key={key.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{key.name}</p><code className="text-sm text-gray-500">{key.keyPrefix}…</code></div><Button variant="outline" size="icon" aria-label={`Revoke ${key.name}`} onClick={() => handleRevoke(key.id)}><Trash2 size={18} /></Button></li>)}{apiKeys.length === 0 && <li className="py-3 text-sm text-gray-500">No active API keys.</li>}</ul></div>;
}

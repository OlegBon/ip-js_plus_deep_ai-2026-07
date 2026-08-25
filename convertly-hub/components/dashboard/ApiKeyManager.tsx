"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clipboard, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/hooks/use-toast";

export default function ApiKeyManager() {
  const [isAllowed, setIsAllowed] = useState(true);
  const [apiKey, setApiKey] = useState("ch_xxxxxx_xxxxxxxxxxxxxxxxxxxx");
  useEffect(() => { if (typeof fetch !== "function") return; fetch("/api/account/billing").then(async (response) => response.ok ? response.json() : null).then((billing) => setIsAllowed(billing ? billing.activePlan !== "FREE" : false)).catch(() => setIsAllowed(false)); }, []);
  if (!isAllowed) return <div className="rounded-lg bg-white p-6 shadow-md"><div className="flex gap-3"><KeyRound className="text-gray-500" /><div><h3 className="text-lg font-semibold">API Keys</h3><p className="mt-1 text-sm text-gray-500">API access is available from the Basic plan.</p><Link href="/pricing" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">View plans</Link></div></div></div>;
  return <div className="rounded-lg bg-white p-6 shadow-md"><div className="flex items-center justify-between"><input readOnly value={apiKey} className="mr-4 w-full rounded border bg-gray-100 p-2 font-mono" /><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Copy API Key" onClick={() => { navigator.clipboard?.writeText(apiKey); toast.success("API Key copied to clipboard!"); }}><Clipboard size={20} /></Button><Button variant="outline" size="icon" aria-label="Regenerate API Key" onClick={() => { setApiKey(`ch_xxxxxx_${Math.random().toString(36).slice(2)}`); toast.success("API Key regenerated!"); }}><RefreshCw size={20} /></Button></div></div></div>;
}

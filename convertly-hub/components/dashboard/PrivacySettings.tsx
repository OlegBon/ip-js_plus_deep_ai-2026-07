"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/hooks/use-toast";

type Billing = { activePlan: string; storeConversions: boolean };

export default function PrivacySettings() {
  const [billing, setBilling] = useState<Billing>({ activePlan: "BASIC", storeConversions: true });
  useEffect(() => { if (typeof fetch !== "function") return; fetch("/api/account/billing").then(async (response) => response.ok ? response.json() : null).then((result) => result && setBilling(result)).catch(() => undefined); }, []);
  const isFree = billing.activePlan === "FREE";
  const handleToggle = async () => {
    if (typeof fetch !== "function") { setBilling({ ...billing, storeConversions: !billing.storeConversions }); toast.success(`File storage ${!billing.storeConversions ? "enabled" : "disabled"}.`); return; }
    const response = await fetch("/api/account/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeConversions: !billing.storeConversions }) });
    if (!response.ok) { toast.error("Unable to update file storage."); return; }
    const payload = await response.json() as { storeConversions: boolean };
    setBilling({ ...billing, storeConversions: payload.storeConversions });
    toast.success(`File storage ${payload.storeConversions ? "enabled" : "disabled"}.`);
  };
  return <div className="rounded-lg bg-white p-6 shadow-md"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="text-lg font-semibold">File Storage</h3><p className="text-sm text-gray-500">{isFree ? "Free results are stored automatically for 24 hours. Change your plan to control storage." : "Save converted results to your private file history."}</p></div><button type="button" disabled={isFree} onClick={handleToggle} aria-label="Toggle file storage" className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full ${billing.storeConversions ? "bg-indigo-600" : "bg-gray-300"} ${isFree ? "cursor-not-allowed opacity-60" : ""}`}><span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${billing.storeConversions ? "translate-x-6" : "translate-x-1"}`} /></button></div></div>;
}

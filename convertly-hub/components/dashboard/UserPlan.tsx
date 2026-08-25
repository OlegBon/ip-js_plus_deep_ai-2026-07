"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBytes, formatPrice, getPlanDefinition } from "@/lib/billing/plans";

type Billing = {
  activePlan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  requestedPlan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE" | null;
  status: "ACTIVE" | "PENDING_DEMO";
  usage: { conversions: { used: number; limit: number }; storageBytes: { used: string; limit: string } };
};

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const percentage = Math.min(100, limit === 0 ? 0 : (used / limit) * 100);
  return <div><div className="flex justify-between text-sm font-medium text-gray-600"><span>{label}</span><span>{percentage.toFixed(0)}%</span></div><div className="mt-1 h-2.5 w-full rounded-full bg-gray-200"><div className="h-2.5 rounded-full bg-indigo-600" style={{ width: `${percentage}%` }} /></div></div>;
}

export default function UserPlan() {
  const [billing, setBilling] = useState<Billing | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account/billing", { signal: controller.signal }).then(async (response) => response.ok ? response.json() : null).then(setBilling).catch(() => undefined);
    return () => controller.abort();
  }, []);
  if (!billing) return <div className="rounded-lg bg-white p-6 shadow-md">Loading plan…</div>;
  const plan = getPlanDefinition(billing.activePlan);
  const storageUsed = Number(billing.usage.storageBytes.used);
  const storageLimit = Number(billing.usage.storageBytes.limit);
  return <div className="rounded-lg bg-white p-6 shadow-md"><div className="grid grid-cols-1 gap-8 md:grid-cols-3"><div><h3 className="text-lg font-semibold text-gray-900">{plan.name} plan</h3><p className="mt-2 text-4xl font-bold">{formatPrice(plan.priceCents)}<span className="ml-2 text-base font-normal text-gray-500">/month</span></p><p className="mt-4 text-sm text-gray-600">{billing.status === "PENDING_DEMO" && billing.requestedPlan ? `${getPlanDefinition(billing.requestedPlan).name} selected — awaiting payment.` : "Active plan"}</p><Link href="/pricing" className="mt-4 block rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50">Change plan</Link></div><div className="space-y-6 md:col-span-2"><UsageBar label={`${billing.usage.conversions.used.toLocaleString("en-US")} / ${billing.usage.conversions.limit.toLocaleString("en-US")} conversions this month`} used={billing.usage.conversions.used} limit={billing.usage.conversions.limit} /><UsageBar label={`${formatBytes(storageUsed)} / ${formatBytes(storageLimit)} stored results`} used={storageUsed} limit={storageLimit} /></div></div></div>;
}

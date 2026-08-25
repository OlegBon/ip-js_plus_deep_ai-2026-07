import type { SubscriptionPlan } from "@prisma/client";

export type PlanDefinition = {
  id: SubscriptionPlan;
  name: string;
  priceCents: number;
  monthlyConversions: number;
  maxFileSizeBytes: number;
  storageBytes: bigint;
  retentionDays: number | null;
  apiAccess: boolean;
  support: string;
  description: string;
  isPopular?: boolean;
};

const MEBIBYTE = 1024 * 1024;
const GIBIBYTE = 1024 * MEBIBYTE;

export const PLAN_CATALOG: Record<SubscriptionPlan, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceCents: 0,
    monthlyConversions: 20,
    maxFileSizeBytes: 10 * MEBIBYTE,
    storageBytes: BigInt(250 * MEBIBYTE),
    retentionDays: 1,
    apiAccess: false,
    support: "Community support",
    description: "For occasional conversions from your dashboard.",
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceCents: 900,
    monthlyConversions: 500,
    maxFileSizeBytes: 25 * MEBIBYTE,
    storageBytes: BigInt(5 * GIBIBYTE),
    retentionDays: 30,
    apiAccess: true,
    support: "Email support",
    description: "For regular work and your first API integrations.",
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceCents: 1900,
    monthlyConversions: 2_000,
    maxFileSizeBytes: 50 * MEBIBYTE,
    storageBytes: BigInt(50 * GIBIBYTE),
    retentionDays: 180,
    apiAccess: true,
    support: "Priority email support",
    description: "For high-volume conversion automation.",
    isPopular: true,
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceCents: 4900,
    monthlyConversions: 10_000,
    maxFileSizeBytes: 100 * MEBIBYTE,
    storageBytes: BigInt(500 * GIBIBYTE),
    retentionDays: null,
    apiAccess: true,
    support: "Priority support and onboarding",
    description: "For teams with agreed limits and dedicated support.",
  },
};

export const PUBLIC_PLANS = Object.values(PLAN_CATALOG);

export function getPlanDefinition(plan: SubscriptionPlan) {
  return PLAN_CATALOG[plan];
}

export function formatBytes(value: bigint | number) {
  const bytes = typeof value === "bigint" ? Number(value) : value;
  if (bytes >= GIBIBYTE) return `${(bytes / GIBIBYTE).toFixed(bytes % GIBIBYTE === 0 ? 0 : 1)} GB`;
  return `${Math.round(bytes / MEBIBYTE)} MB`;
}

export function formatPrice(priceCents: number) {
  return priceCents === 0 ? "$0" : `$${(priceCents / 100).toFixed(0)}`;
}

export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return typeof value === "string" && value in PLAN_CATALOG;
}

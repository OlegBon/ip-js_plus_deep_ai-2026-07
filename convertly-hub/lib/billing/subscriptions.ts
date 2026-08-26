import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlanDefinition, isSubscriptionPlan } from "@/lib/billing/plans";
import { lockUserQuota } from "@/lib/billing/quota-lock";

export class BillingUserNotFoundError extends Error {}
export class InvalidMockCheckoutError extends Error {}
export class StorageQuotaExceededError extends Error {}

export type BillingOverview = {
  activePlan: SubscriptionPlan;
  requestedPlan: SubscriptionPlan | null;
  status: "ACTIVE" | "PENDING_DEMO";
  usage: {
    conversions: { used: number; limit: number };
    storageBytes: { used: bigint; limit: bigint };
  };
  storeConversions: boolean;
};

export async function getBillingOverview(userId: string): Promise<BillingOverview> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      storeConversions: true,
      subscription: { select: { activePlan: true, requestedPlan: true, status: true } },
    },
  });
  if (!user) throw new BillingUserNotFoundError();

  const activePlan = user.subscription?.activePlan ?? user.plan;
  const plan = getPlanDefinition(activePlan);
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [conversions, storage] = await Promise.all([
    prisma.conversionLog.count({
      where: { userId, status: "COMPLETED", createdAt: { gte: periodStart } },
    }),
    prisma.conversionLog.aggregate({
      where: { userId, storageKey: { not: null }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      _sum: { resultSize: true },
    }),
  ]);

  return {
    activePlan,
    requestedPlan: user.subscription?.requestedPlan ?? null,
    status: user.subscription?.status ?? "ACTIVE",
    usage: {
      conversions: { used: conversions, limit: plan.monthlyConversions },
      storageBytes: { used: storage._sum.resultSize ?? BigInt(0), limit: plan.storageBytes },
    },
    storeConversions: activePlan === "FREE" ? true : user.storeConversions,
  };
}

export async function requestMockPlanChange(userId: string, input: unknown) {
  const details = parseMockCheckoutInput(input);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user) throw new BillingUserNotFoundError();

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      activePlan: user.plan,
      requestedPlan: details.plan === user.plan ? null : details.plan,
      status: details.plan === user.plan ? "ACTIVE" : "PENDING_DEMO",
    },
    update: {
      requestedPlan: details.plan === user.plan ? null : details.plan,
      status: details.plan === user.plan ? "ACTIVE" : "PENDING_DEMO",
    },
    select: { activePlan: true, requestedPlan: true, status: true },
  });

  return subscription;
}

export async function getActivePlanForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscription: { select: { activePlan: true } } },
  });
  if (!user) throw new BillingUserNotFoundError();
  return user.subscription?.activePlan ?? user.plan;
}

export async function reserveStorageCapacity(userId: string, plan: SubscriptionPlan, conversionId: string, resultSize: bigint) {
  const quota = getPlanDefinition(plan).storageBytes;
  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    await lockUserQuota(transaction, userId);
    const [storage, reservations] = await Promise.all([
      transaction.conversionLog.aggregate({
        where: { userId, storageKey: { not: null }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        _sum: { resultSize: true },
      }),
      transaction.conversionLog.aggregate({
        where: { userId, status: "PROCESSING", storageReservationBytes: { not: null } },
        _sum: { storageReservationBytes: true },
      }),
    ]);
    const used = storage._sum.resultSize ?? BigInt(0);
    const reserved = reservations._sum.storageReservationBytes ?? BigInt(0);
    if (used + reserved + resultSize > quota) throw new StorageQuotaExceededError();

    const claimed = await transaction.conversionLog.updateMany({
      where: { id: conversionId, userId, status: "PROCESSING", storageReservationBytes: null },
      data: { storageReservationBytes: resultSize },
    });
    if (claimed.count !== 1) throw new Error("Conversion is not available for storage reservation.");
  });
}

export async function updateStoragePreference(userId: string, storeConversions: boolean) {
  const activePlan = await getActivePlanForUser(userId);
  if (activePlan === "FREE") throw new InvalidMockCheckoutError();
  await prisma.user.update({ where: { id: userId }, data: { storeConversions } });
  return storeConversions;
}

function parseMockCheckoutInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InvalidMockCheckoutError();
  const { plan, billingName, country, acceptedDemoTerms } = value as Record<string, unknown>;
  if (
    !isSubscriptionPlan(plan) ||
    typeof billingName !== "string" ||
    billingName.trim().length < 2 ||
    billingName.trim().length > 100 ||
    typeof country !== "string" ||
    !/^[A-Z]{2}$/.test(country) ||
    acceptedDemoTerms !== true
  ) {
    throw new InvalidMockCheckoutError();
  }
  return { plan };
}

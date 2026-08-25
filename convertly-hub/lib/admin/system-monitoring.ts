import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/s3";
import { AdminAccessDeniedError } from "./user-management";

const ACTIVE_USER_WINDOW_DAYS = 30;

async function serviceStatus(check: () => Promise<unknown>) {
  try { await check(); return "up" as const; } catch { return "down" as const; }
}

export async function getAdminSystemMetrics(actorUserId: string) {
  const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true, status: true } });
  if (!actor || actor.role !== "ADMIN" || actor.status !== "ACTIVE") throw new AdminAccessDeniedError();

  const since = new Date(Date.now() - ACTIVE_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [activeUsers, totalConversions, failedConversions, gotenberg, storage] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE", lastLoginAt: { gte: since } } }),
    prisma.conversionLog.count(),
    prisma.conversionLog.count({ where: { status: "FAILED" } }),
    serviceStatus(async () => { const response = await fetch(`${(process.env.GOTENBERG_URL ?? "http://localhost:3000").replace(/\/$/, "")}/health`, { cache: "no-store" }); if (!response.ok) throw new Error("Gotenberg unavailable"); }),
    serviceStatus(() => getStorageService().ensureBucket()),
  ]);

  return {
    activeUsers,
    activeUsersWindowDays: ACTIVE_USER_WINDOW_DAYS,
    totalConversions,
    failedConversions,
    errorRate: totalConversions === 0 ? 0 : Number(((failedConversions / totalConversions) * 100).toFixed(1)),
    services: { database: "up" as const, gotenberg, storage },
  };
}

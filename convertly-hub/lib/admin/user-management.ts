import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_SEARCH_LENGTH = 100;

export type AdminUserStatus = "ACTIVE" | "SUSPENDED";

export class AdminAccessDeniedError extends Error {}

export function parseAdminUserSearch(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const query = (searchParams.get("query") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  const cursor = searchParams.get("cursor") || undefined;
  return { limit, query, cursor };
}

export function parseAdminUserStatus(value: unknown): AdminUserStatus | null {
  return value === "ACTIVE" || value === "SUSPENDED" ? value : null;
}

export async function listAdminUsers(actorUserId: string, options: ReturnType<typeof parseAdminUserSearch>) {
  await ensureActiveAdmin(actorUserId);

  const users = await prisma.user.findMany({
    where: options.query
      ? {
          OR: [
            { email: { contains: options.query, mode: "insensitive" } },
            { name: { contains: options.query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: adminUserSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasNextPage = users.length > options.limit;
  const page = hasNextPage ? users.slice(0, options.limit) : users;
  return {
    users: page,
    nextCursor: hasNextPage ? page.at(-1)?.id ?? null : null,
  };
}

export async function updateAdminUserStatus(
  actorUserId: string,
  targetUserId: string,
  status: AdminUserStatus,
) {
  await ensureActiveAdmin(actorUserId);
  if (actorUserId === targetUserId) return "SELF_UPDATE_FORBIDDEN" as const;

  const updated = await prisma.user.updateMany({
    where: { id: targetUserId },
    data: { status },
  });
  return updated.count > 0 ? "UPDATED" as const : "NOT_FOUND" as const;
}

export async function revokeAdminApiKey(actorUserId: string, apiKeyId: string) {
  await ensureActiveAdmin(actorUserId);

  const revoked = await prisma.apiKey.updateMany({
    where: { id: apiKeyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return revoked.count > 0;
}

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  plan: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

async function ensureActiveAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    throw new AdminAccessDeniedError();
  }
}

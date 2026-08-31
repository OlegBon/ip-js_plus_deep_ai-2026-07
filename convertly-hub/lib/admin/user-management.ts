import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_SEARCH_LENGTH = 100;

export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED';
const sortableFields = ['createdAt', 'email', 'role', 'plan', 'status', 'lastLoginAt'] as const;
type SortField = (typeof sortableFields)[number];

export class AdminAccessDeniedError extends Error {}

export function parseAdminUserSearch(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get('limit') ?? DEFAULT_PAGE_SIZE);
  const limit = Number.isInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  const query = (searchParams.get('query') ?? '').trim().slice(0, MAX_SEARCH_LENGTH);
  const cursor = searchParams.get('cursor') || undefined;
  const rawSort = searchParams.get('sort');
  const sort = sortableFields.includes(rawSort as SortField) ? (rawSort as SortField) : 'createdAt';
  const direction = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';
  return { limit, query, cursor, sort, direction };
}

export function parseAdminUserStatus(value: unknown): AdminUserStatus | null {
  return value === 'ACTIVE' || value === 'SUSPENDED' ? value : null;
}

export async function listAdminUsers(
  actorUserId: string,
  options: ReturnType<typeof parseAdminUserSearch>,
) {
  await ensureActiveAdmin(actorUserId);

  const where = options.query
    ? {
        OR: [
          { email: { contains: options.query, mode: 'insensitive' as const } },
          { name: { contains: options.query, mode: 'insensitive' as const } },
        ],
      }
    : undefined;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: [
        { [options.sort]: options.direction as Prisma.SortOrder },
        { id: options.direction as Prisma.SortOrder },
      ],
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    }),
    prisma.user.count({ where }),
  ]);

  const hasNextPage = users.length > options.limit;
  const page = hasNextPage ? users.slice(0, options.limit) : users;
  return {
    users: page.map(({ subscription, ...user }) => ({
      ...user,
      plan: subscription?.activePlan ?? user.plan,
    })),
    nextCursor: hasNextPage ? (page.at(-1)?.id ?? null) : null,
    total,
  };
}

export async function updateAdminUserStatus(
  actorUserId: string,
  targetUserId: string,
  status: AdminUserStatus,
) {
  await ensureActiveAdmin(actorUserId);
  if (actorUserId === targetUserId) return 'SELF_UPDATE_FORBIDDEN' as const;

  const updated = await prisma.user.updateMany({
    where: { id: targetUserId },
    data: { status },
  });
  return updated.count > 0 ? ('UPDATED' as const) : ('NOT_FOUND' as const);
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
  subscription: { select: { activePlan: true } },
  lastLoginAt: true,
  createdAt: true,
  apiKeys: { where: { revokedAt: null }, select: { id: true, name: true, keyPrefix: true } },
} as const;

async function ensureActiveAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });
  if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
    throw new AdminAccessDeniedError();
  }
}

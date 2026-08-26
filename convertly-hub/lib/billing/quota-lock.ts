import type { Prisma } from "@prisma/client";

/**
 * Serializes the short quota-check-and-reserve transaction for one user.
 * PostgreSQL advisory locks are scoped to the transaction and avoid holding a
 * database transaction open while a conversion worker or S3 is running.
 */
export async function lockUserQuota(transaction: Prisma.TransactionClient, userId: string) {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${`convertly:user-quota:${userId}`}))
  `;
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const [legacyColumn] = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = 'plan'
    ) AS "legacyPlanColumnPresent"
  `;
  const [result] = legacyColumn.legacyPlanColumnPresent
    ? await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS "totalUsers",
      COUNT(*) FILTER (WHERE s."userId" IS NULL)::int AS "usersWithoutSubscription",
      COUNT(*) FILTER (
        WHERE s."userId" IS NOT NULL AND u."plan" <> s."activePlan"
      )::int AS "legacyPlanMismatches"
    FROM "User" u
    LEFT JOIN "Subscription" s ON s."userId" = u."id"
  `
    : await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS "totalUsers",
      COUNT(*) FILTER (WHERE s."userId" IS NULL)::int AS "usersWithoutSubscription",
      NULL::int AS "legacyPlanMismatches"
    FROM "User" u
    LEFT JOIN "Subscription" s ON s."userId" = u."id"
  `;

  console.info('Subscription plan audit completed.');
  console.info(JSON.stringify({ ...result, legacyPlanColumnPresent: legacyColumn.legacyPlanColumnPresent }));
} finally {
  await prisma.$disconnect();
  await pool.end();
}

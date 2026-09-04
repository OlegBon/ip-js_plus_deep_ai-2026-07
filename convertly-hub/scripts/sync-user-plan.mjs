import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import { Pool } from 'pg';
import planSyncCore from './plan-sync-core.cjs';

const { parsePlanSyncEnvironment, synchronizeUserPlan } = planSyncCore;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const { email, plan } = parsePlanSyncEnvironment(process.env, Object.values(SubscriptionPlan));
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

try {
  const result = await synchronizeUserPlan(prisma, email, plan);
  console.info(
    `Plan synchronized: ${result.previousUserPlan}/${result.previousSubscriptionPlan ?? 'none'} -> ${result.activePlan}.`,
  );
} finally {
  await prisma.$disconnect();
}

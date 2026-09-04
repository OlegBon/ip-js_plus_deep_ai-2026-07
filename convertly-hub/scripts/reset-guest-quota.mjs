import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import guestQuotaResetCore from './guest-quota-reset-core.cjs';

const { parseGuestQuotaResetEnvironment, resetGuestQuota } = guestQuotaResetCore;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const supportCode = parseGuestQuotaResetEnvironment(process.env);
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

try {
  await resetGuestQuota(prisma, supportCode);
  console.info('Guest quota reset completed.');
} finally {
  await prisma.$disconnect();
}

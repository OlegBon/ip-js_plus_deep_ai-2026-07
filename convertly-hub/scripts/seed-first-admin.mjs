import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
if (!email) {
  throw new Error("SEED_ADMIN_EMAIL must contain a registered user's email.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

try {
  const result = await prisma.$transaction(async (transaction) => {
    const existingAdmin = await transaction.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (existingAdmin) throw new Error("An administrator already exists.");

    const user = await transaction.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, role: true },
    });
    await transaction.roleChangeAudit.create({
      data: { targetUserId: user.id, previousRole: "USER", newRole: "ADMIN" },
    });
    return user;
  });
  console.info(`First administrator assigned: ${result.id}`);
} finally {
  await prisma.$disconnect();
}

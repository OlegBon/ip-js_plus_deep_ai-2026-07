import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function promoteFirstAdmin(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return prisma.$transaction(async (transaction) => {
    const existingAdmin = await transaction.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (existingAdmin) {
      throw new Error("An administrator already exists.");
    }

    const user = await transaction.user.update({
      where: { email: normalizedEmail },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    await transaction.roleChangeAudit.create({
      data: {
        targetUserId: user.id,
        previousRole: "USER",
        newRole: "ADMIN",
      },
    });

    return user;
  });
}

export async function changeUserRole(actorUserId: string, targetUserId: string, newRole: UserRole) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!user || user.id === actorUserId || user.role === newRole) {
      return null;
    }

    const updatedUser = await transaction.user.update({
      where: { id: user.id },
      data: { role: newRole },
      select: { id: true, role: true },
    });

    await transaction.roleChangeAudit.create({
      data: {
        actorUserId,
        targetUserId: user.id,
        previousRole: user.role,
        newRole,
      },
    });

    return updatedUser;
  });
}

ALTER TABLE "User" ADD COLUMN "telegramVerificationExpires" TIMESTAMPTZ(3);

CREATE TABLE "RoleChangeAudit" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT NOT NULL,
    "previousRole" "UserRole" NOT NULL,
    "newRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleChangeAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoleChangeAudit_targetUserId_createdAt_idx" ON "RoleChangeAudit"("targetUserId", "createdAt");
CREATE INDEX "RoleChangeAudit_actorUserId_createdAt_idx" ON "RoleChangeAudit"("actorUserId", "createdAt");

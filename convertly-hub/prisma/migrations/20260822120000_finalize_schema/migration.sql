-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "ConversionLog" DROP CONSTRAINT "ConversionLog_userId_fkey";

-- DropIndex
DROP INDEX "User_emailVerificationToken_key";

-- DropIndex
DROP INDEX "User_passwordResetToken_key";

-- DropIndex
DROP INDEX "User_telegramVerificationToken_key";

-- AlterTable
ALTER TABLE "ConversionLog" DROP COLUMN "fileName",
ADD COLUMN     "apiKeyId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMPTZ(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "resultFileName" TEXT,
ADD COLUMN     "resultMimeType" TEXT,
ADD COLUMN     "resultSize" BIGINT,
ADD COLUMN     "sourceFileName" TEXT NOT NULL,
ADD COLUMN     "sourceMimeType" TEXT NOT NULL,
ADD COLUMN     "sourceSize" BIGINT NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMPTZ(3),
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "targetFormat" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ConversionStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationToken",
DROP COLUMN "passwordResetToken",
DROP COLUMN "telegramVerificationToken",
ADD COLUMN     "emailVerificationTokenHash" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMPTZ(3),
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "storeConversions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "telegramVerificationTokenHash" TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "emailVerified" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "passwordResetExpires" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "telegramVerified" SET DATA TYPE TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastUsedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_userId_revokedAt_idx" ON "ApiKey"("userId", "revokedAt");
CREATE UNIQUE INDEX "ConversionLog_storageKey_key" ON "ConversionLog"("storageKey");
CREATE INDEX "ConversionLog_userId_createdAt_idx" ON "ConversionLog"("userId", "createdAt");
CREATE INDEX "ConversionLog_status_createdAt_idx" ON "ConversionLog"("status", "createdAt");
CREATE INDEX "ConversionLog_apiKeyId_idx" ON "ConversionLog"("apiKeyId");
CREATE UNIQUE INDEX "User_emailVerificationTokenHash_key" ON "User"("emailVerificationTokenHash");
CREATE UNIQUE INDEX "User_passwordResetTokenHash_key" ON "User"("passwordResetTokenHash");
CREATE UNIQUE INDEX "User_telegramVerificationTokenHash_key" ON "User"("telegramVerificationTokenHash");
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversionLog" ADD CONSTRAINT "ConversionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversionLog" ADD CONSTRAINT "ConversionLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

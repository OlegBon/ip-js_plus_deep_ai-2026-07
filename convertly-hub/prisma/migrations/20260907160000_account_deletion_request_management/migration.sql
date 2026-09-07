ALTER TYPE "AccountDeletionStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "AccountDeletionEventType" ADD VALUE 'CANCELLED';

ALTER TABLE "AccountDeletionRequest"
  ADD COLUMN "cancelledAt" TIMESTAMPTZ(3),
  ADD COLUMN "cancelledByUserId" TEXT,
  ADD COLUMN "cancelledByEmail" TEXT;

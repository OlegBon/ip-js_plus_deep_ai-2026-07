-- Account deletion requests and their audit trail survive removal of the User row.
CREATE TYPE "AccountDeletionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "AccountDeletionEventType" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "status" "AccountDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "failureReason" TEXT,
    "processedByUserId" TEXT,
    "processedByEmail" TEXT,

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountDeletionEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "AccountDeletionEventType" NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeletionEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "AccountDeletionRequest"("userId");
CREATE INDEX "AccountDeletionRequest_status_requestedAt_idx" ON "AccountDeletionRequest"("status", "requestedAt");
CREATE INDEX "AccountDeletionEvent_requestId_createdAt_idx" ON "AccountDeletionEvent"("requestId", "createdAt");

ALTER TABLE "AccountDeletionRequest"
  ADD CONSTRAINT "AccountDeletionRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountDeletionEvent"
  ADD CONSTRAINT "AccountDeletionEvent_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "AccountDeletionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

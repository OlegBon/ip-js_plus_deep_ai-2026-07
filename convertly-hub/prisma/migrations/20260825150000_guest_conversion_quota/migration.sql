CREATE TABLE "GuestConversionQuota" (
  "id" TEXT NOT NULL,
  "visitorHash" TEXT NOT NULL,
  "periodStart" TIMESTAMPTZ(3) NOT NULL,
  "imageCount" INTEGER NOT NULL DEFAULT 0,
  "documentCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GuestConversionQuota_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuestConversionQuota_visitorHash_periodStart_key" ON "GuestConversionQuota"("visitorHash", "periodStart");
CREATE INDEX "GuestConversionQuota_periodStart_idx" ON "GuestConversionQuota"("periodStart");

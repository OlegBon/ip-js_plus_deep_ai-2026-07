ALTER TABLE "GuestConversionQuota" ADD COLUMN "supportCodeHash" TEXT;

CREATE UNIQUE INDEX "GuestConversionQuota_supportCodeHash_key" ON "GuestConversionQuota"("supportCodeHash");

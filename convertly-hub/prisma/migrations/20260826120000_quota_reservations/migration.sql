-- Reserve storage before uploading an object so concurrent workers cannot
-- overrun a user's plan quota. Nullable keeps the migration compatible with
-- all existing conversion records.
ALTER TABLE "ConversionLog"
ADD COLUMN "storageReservationBytes" BIGINT;

CREATE INDEX "ConversionLog_userId_expiresAt_idx"
ON "ConversionLog"("userId", "expiresAt");

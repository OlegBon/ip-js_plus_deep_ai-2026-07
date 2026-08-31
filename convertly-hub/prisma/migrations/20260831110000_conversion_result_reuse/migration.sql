-- Nullable: existing conversion logs do not retain the original binary and cannot be backfilled safely.
ALTER TABLE "ConversionLog" ADD COLUMN "sourceFileHash" TEXT;

CREATE INDEX "ConversionLog_userId_sourceFileHash_targetFormat_idx"
ON "ConversionLog"("userId", "sourceFileHash", "targetFormat");

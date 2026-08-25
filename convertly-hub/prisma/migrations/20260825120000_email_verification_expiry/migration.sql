-- Add a TTL to email-verification links. The nullable field is safe for existing users.
ALTER TABLE "User" ADD COLUMN "emailVerificationExpires" TIMESTAMPTZ(3);

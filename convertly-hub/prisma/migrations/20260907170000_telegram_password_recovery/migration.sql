ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;

CREATE UNIQUE INDEX "User_telegramUsername_key" ON "User"("telegramUsername");

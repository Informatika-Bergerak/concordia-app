ALTER TYPE "TrustTransactionType" ADD VALUE IF NOT EXISTS 'SUSPENSION';
ALTER TYPE "TrustTransactionType" ADD VALUE IF NOT EXISTS 'RESTORATION';
ALTER TABLE "User" ADD COLUMN "isProfilePrivate" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "TrustXpSuspension" (
    "id" SERIAL NOT NULL,
    "earnTransactionId" INTEGER NOT NULL,
    "suspensionTransactionId" INTEGER NOT NULL,
    "restorationTransactionId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),

    CONSTRAINT "TrustXpSuspension_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrustXpSuspension_earnTransactionId_key" ON "TrustXpSuspension"("earnTransactionId");
CREATE UNIQUE INDEX "TrustXpSuspension_suspensionTransactionId_key" ON "TrustXpSuspension"("suspensionTransactionId");
CREATE UNIQUE INDEX "TrustXpSuspension_restorationTransactionId_key" ON "TrustXpSuspension"("restorationTransactionId");
ALTER TABLE "TrustXpSuspension" ADD CONSTRAINT "TrustXpSuspension_earnTransactionId_fkey" FOREIGN KEY ("earnTransactionId") REFERENCES "TrustTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustXpSuspension" ADD CONSTRAINT "TrustXpSuspension_suspensionTransactionId_fkey" FOREIGN KEY ("suspensionTransactionId") REFERENCES "TrustTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustXpSuspension" ADD CONSTRAINT "TrustXpSuspension_restorationTransactionId_fkey" FOREIGN KEY ("restorationTransactionId") REFERENCES "TrustTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustXpSuspension" ADD CONSTRAINT "TrustXpSuspension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

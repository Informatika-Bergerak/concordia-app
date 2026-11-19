DROP INDEX "TrustXpSuspension_earnTransactionId_key";
CREATE INDEX "TrustXpSuspension_earnTransactionId_idx" ON "TrustXpSuspension"("earnTransactionId");

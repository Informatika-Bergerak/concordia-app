-- Trust Level V1: auditable XP ledger and one-time milestone claims.
CREATE TYPE "TrustTransactionType" AS ENUM ('EARN', 'REVERSAL', 'PENALTY', 'ADJUSTMENT');

CREATE TABLE "TrustTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TrustTransactionType" NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalTransactionId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TrustTransaction_amount_not_zero" CHECK ("amount" <> 0),
    CONSTRAINT "TrustTransaction_reversal_type" CHECK (("originalTransactionId" IS NULL) OR "type" = 'REVERSAL')
);

CREATE TABLE "TrustMilestone" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "milestone" TEXT NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustMilestone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrustTransaction_originalTransactionId_key" ON "TrustTransaction"("originalTransactionId");
CREATE UNIQUE INDEX "TrustTransaction_userId_type_source_sourceId_key" ON "TrustTransaction"("userId", "type", "source", "sourceId");
CREATE INDEX "TrustTransaction_userId_createdAt_idx" ON "TrustTransaction"("userId", "createdAt");
CREATE INDEX "TrustTransaction_source_sourceId_idx" ON "TrustTransaction"("source", "sourceId");
CREATE UNIQUE INDEX "TrustMilestone_userId_milestone_key" ON "TrustMilestone"("userId", "milestone");
CREATE UNIQUE INDEX "TrustMilestone_transactionId_key" ON "TrustMilestone"("transactionId");

ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "TrustTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrustMilestone" ADD CONSTRAINT "TrustMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustMilestone" ADD CONSTRAINT "TrustMilestone_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "TrustTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ledger writers must atomically insert a transaction and update User.trustScore.
-- Database guardrails enforce no XP debt and exclude ADMIN accounts.
CREATE FUNCTION "enforceTrustTransaction"() RETURNS TRIGGER AS $$
DECLARE
    target_role "Role";
    target_user_type "UserType";
    current_score INTEGER;
BEGIN
    SELECT "role", "userType", "trustScore" INTO target_role, target_user_type, current_score FROM "User" WHERE "id" = NEW."userId" FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trust transaction user % does not exist', NEW."userId";
    END IF;
    IF target_role <> 'MODERATOR' AND (target_role <> 'USER' OR target_user_type IS NULL) THEN
        RAISE EXCEPTION 'User % is not eligible for Trust Level', NEW."userId";
    END IF;
    IF current_score + NEW."amount" < 0 THEN
        RAISE EXCEPTION 'Trust Level XP cannot become negative';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TrustTransaction_enforce_before_insert"
BEFORE INSERT ON "TrustTransaction"
FOR EACH ROW EXECUTE FUNCTION "enforceTrustTransaction"();

ALTER TABLE "User" ADD CONSTRAINT "User_trustScore_nonnegative" CHECK ("trustScore" >= 0);

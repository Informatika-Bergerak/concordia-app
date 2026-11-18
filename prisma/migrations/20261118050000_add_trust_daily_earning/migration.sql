-- Cached daily EARN total. The cap trigger serializes concurrent rewards per user and WIB day.
CREATE TABLE "TrustDailyEarning" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustDailyEarning_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TrustDailyEarning_amount_nonnegative" CHECK ("amount" >= 0),
    CONSTRAINT "TrustDailyEarning_amount_cap" CHECK ("amount" <= 200)
);

CREATE UNIQUE INDEX "TrustDailyEarning_userId_date_key" ON "TrustDailyEarning"("userId", "date");
ALTER TABLE "TrustDailyEarning" ADD CONSTRAINT "TrustDailyEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

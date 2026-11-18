import type { PrismaClient } from "@/generated/prisma/client";
import { earnDailyXpInTransaction, type EarnXpResult } from "./daily-cap";

export const THREAD_XP = 25;
const THREAD_SOURCE = "FORUM_THREAD";
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export function rewardThreadXp(tx: Tx, userId: number, threadId: number): Promise<EarnXpResult> {
  return earnDailyXpInTransaction(tx, { userId, requestedXp: THREAD_XP, source: THREAD_SOURCE, sourceId: String(threadId) });
}

/** Call from the future author-owned thread deletion transaction. */
export async function reverseThreadXp(tx: Tx, userId: number, threadId: number): Promise<number> {
  const earned = await tx.trustTransaction.findUnique({
    where: { userId_type_source_sourceId: { userId, type: "EARN", source: THREAD_SOURCE, sourceId: String(threadId) } },
  });
  if (!earned) return 0;

  const reversal = await tx.trustTransaction.findUnique({ where: { originalTransactionId: earned.id } });
  if (reversal) return 0;

  const amount = -earned.amount;
  await tx.trustTransaction.create({
    data: {
      userId,
      amount,
      type: "REVERSAL",
      source: THREAD_SOURCE,
      sourceId: `delete:${threadId}`,
      originalTransactionId: earned.id,
    },
  });
  await tx.user.update({ where: { id: userId }, data: { trustScore: { decrement: earned.amount } } });
  return earned.amount;
}

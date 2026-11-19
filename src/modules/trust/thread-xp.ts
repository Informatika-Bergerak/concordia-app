import type { PrismaClient } from "@/generated/prisma/client";
import { earnDailyXpInTransaction, type EarnXpResult } from "./daily-cap";

export const THREAD_XP = 25;
const THREAD_SOURCE = "FORUM_THREAD";
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function rewardThreadXp(tx: Tx, userId: number, threadId: number): Promise<EarnXpResult> {
  const users = await tx.$queryRaw<{ isProfilePrivate: boolean }[]>`
    SELECT "isProfilePrivate" FROM "User" WHERE "id" = ${userId} FOR UPDATE
  `;
  if (users[0]?.isProfilePrivate) return { grantedXp: 0, remainingXp: 0, transactionId: null, duplicate: false, eligible: true };
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

  const suspension = await tx.trustXpSuspension.findFirst({ where: { earnTransactionId: earned.id, restorationTransactionId: null }, orderBy: { createdAt: "desc" } });
  const users = await tx.$queryRaw<{ trustScore: number }[]>`SELECT "trustScore" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  let actual = Math.min(earned.amount, users[0]?.trustScore ?? 0);
  if (suspension && !suspension.restorationTransactionId) {
    const restoration = await tx.trustTransaction.create({
      data: { userId, amount: earned.amount, type: "RESTORATION", source: THREAD_SOURCE, sourceId: `delete-restore:${threadId}` },
    });
    await tx.user.update({ where: { id: userId }, data: { trustScore: { increment: earned.amount } } });
    await tx.trustXpSuspension.update({ where: { id: suspension.id }, data: { restorationTransactionId: restoration.id, restoredAt: new Date() } });
    actual = earned.amount;
  }
  if (actual) {
    await tx.trustTransaction.create({
      data: { userId, amount: -actual, type: "REVERSAL", source: THREAD_SOURCE, sourceId: `delete:${threadId}`, originalTransactionId: earned.id },
    });
    await tx.user.update({ where: { id: userId }, data: { trustScore: { decrement: actual } } });
  }
  return actual;
}

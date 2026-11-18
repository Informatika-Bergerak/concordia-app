import type { PrismaClient } from "@/generated/prisma/client";

export const TRUST_VIOLATION_PENALTY = 50;

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

type ModerationInput = {
  actorId?: number;
  userId: number;
  source: string;
  sourceId: string;
  reason?: string;
  additionalAction?: string;
};

async function lockUser(tx: Tx, userId: number) {
  const users = await tx.$queryRaw<{ trustScore: number }[]>`SELECT "trustScore" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  return users[0] ?? null;
}

async function reverseContentXp(tx: Tx, input: ModerationInput, balance: number) {
  const sources = input.source === "FORUM_THREAD" ? ["FORUM_THREAD", "FORUM_LIKE_MILESTONE", "FORUM_COMMENT_MILESTONE"] : [input.source];
  const earnings = await tx.trustTransaction.findMany({
    where: {
      userId: input.userId,
      type: "EARN",
      source: { in: sources },
      OR: [{ sourceId: input.sourceId }, { sourceId: { startsWith: `${input.sourceId}:` } }],
      reversal: null,
    },
  });
  let requested = 0;
  let actual = 0;
  for (const earn of earnings) {
    requested += earn.amount;
    const deducted = Math.min(earn.amount, balance - actual);
    if (deducted) {
      await tx.trustTransaction.create({
        data: { userId: input.userId, amount: -deducted, type: "REVERSAL", source: input.source, sourceId: `moderation:${input.sourceId}:${earn.id}`, originalTransactionId: earn.id, createdById: input.actorId },
      });
      actual += deducted;
    }
  }
  return { requested, actual };
}

async function audit(tx: Tx, input: ModerationInput, metadata: object) {
  await tx.auditLog.create({ data: { action: "TRUST_MODERATION", actorId: input.actorId, targetId: input.userId, metadata: { source: input.source, sourceId: input.sourceId, reason: input.reason ?? null, additionalAction: input.additionalAction ?? null, ...metadata } } });
}

export async function reverseOwnContentXp(db: PrismaClient, input: Omit<ModerationInput, "actorId">) {
  return db.$transaction((tx) => reverseOwnContentXpInTransaction(tx, input));
}

export async function reverseOwnContentXpInTransaction(tx: Tx, input: Omit<ModerationInput, "actorId">) {
    const user = await lockUser(tx, input.userId);
    if (!user) return { reversed: 0, before: 0, after: 0 };
    const reversal = await reverseContentXp(tx, input, user.trustScore);
    if (!reversal.requested) return { reversed: 0, before: user.trustScore, after: user.trustScore };
    if (reversal.actual) await tx.user.update({ where: { id: input.userId }, data: { trustScore: { decrement: reversal.actual } } });
    await audit(tx, input, { action: "SELF_DELETION", reversalRequested: reversal.requested, reversalActual: reversal.actual, penaltyRequested: 0, penaltyActual: 0, balanceBefore: user.trustScore, balanceAfter: user.trustScore - reversal.actual });
    return { reversed: reversal.actual, before: user.trustScore, after: user.trustScore - reversal.actual };
}

export async function applyConfirmedViolation(db: PrismaClient, input: ModerationInput) {
  return db.$transaction((tx) => applyConfirmedViolationInTransaction(tx, input));
}

export async function applyConfirmedViolationInTransaction(tx: Tx, input: ModerationInput) {
    const user = await lockUser(tx, input.userId);
    if (!user) return { reversed: 0, penalized: 0, before: 0, after: 0 };
    const existingPenalty = await tx.trustTransaction.findUnique({ where: { userId_type_source_sourceId: { userId: input.userId, type: "PENALTY", source: input.source, sourceId: `violation:${input.sourceId}` } } });
    const existingViolation = await tx.auditLog.findFirst({ where: { action: "TRUST_MODERATION", targetId: input.userId, metadata: { path: ["action"], equals: "CONFIRMED_VIOLATION" } }, orderBy: { id: "desc" } });
    if (existingPenalty || (existingViolation && (existingViolation.metadata as { source?: string; sourceId?: string }).source === input.source && (existingViolation.metadata as { sourceId?: string }).sourceId === input.sourceId)) return { reversed: 0, penalized: 0, before: user.trustScore, after: user.trustScore };
    const reversed = await reverseContentXp(tx, input, user.trustScore);
    const reversal = reversed.actual;
    const afterReversal = user.trustScore - reversal;
    const penalty = Math.min(TRUST_VIOLATION_PENALTY, afterReversal);
    if (penalty) await tx.trustTransaction.create({ data: { userId: input.userId, amount: -penalty, type: "PENALTY", source: input.source, sourceId: `violation:${input.sourceId}`, createdById: input.actorId } });
    const deducted = reversal + penalty;
    if (deducted) await tx.user.update({ where: { id: input.userId }, data: { trustScore: { decrement: deducted } } });
    await audit(tx, input, { action: "CONFIRMED_VIOLATION", reversalRequested: reversed.requested, reversalActual: reversal, penaltyRequested: TRUST_VIOLATION_PENALTY, penaltyActual: penalty, balanceBefore: user.trustScore, balanceAfter: user.trustScore - deducted });
    return { reversed: reversal, penalized: penalty, before: user.trustScore, after: user.trustScore - deducted };
}

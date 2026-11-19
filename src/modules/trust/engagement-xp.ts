import type { PrismaClient } from "@/generated/prisma/client";
import { earnDailyXpInTransaction } from "./daily-cap";

const XP = 5;
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
type Engagement = "LIKE" | "COMMENT";

function milestone(postId: number, kind: Engagement, number: number) {
  return `FORUM_${kind}:${postId}:${number}`;
}

async function lockPost(tx: Tx, postId: number) {
  const posts = await tx.$queryRaw<{ authorId: number; isProfilePrivate: boolean }[]>`
    SELECT p."authorId", u."isProfilePrivate"
    FROM "ForumPost" p JOIN "User" u ON u."id" = p."authorId"
    WHERE p."id" = ${postId} FOR UPDATE
  `;
  return posts[0] ?? null;
}

async function activeUniqueCount(tx: Tx, postId: number, authorId: number, kind: Engagement) {
  if (kind === "LIKE") return tx.forumPostLike.count({ where: { postId, userId: { not: authorId }, trustEligible: true } });
  const commenters = await tx.forumComment.findMany({ where: { postId, authorId: { not: authorId }, trustEligible: true }, distinct: ["authorId"], select: { authorId: true } });
  return commenters.length;
}

export async function isThreadEngagementEligible(tx: Tx, postId: number): Promise<boolean> {
  return !(await lockPost(tx, postId))?.isProfilePrivate;
}

export async function rewardEngagementMilestones(tx: Tx, postId: number, kind: Engagement): Promise<void> {
  const post = await lockPost(tx, postId);
  if (!post || post.isProfilePrivate) return;
  const step = kind === "LIKE" ? 5 : 3;
  const count = await activeUniqueCount(tx, postId, post.authorId, kind);
  for (let number = 1; number <= Math.floor(count / step); number += 1) {
    const name = milestone(postId, kind, number);
    if (await tx.trustMilestone.findUnique({ where: { userId_milestone: { userId: post.authorId, milestone: name } } })) continue;
    const reward = await earnDailyXpInTransaction(tx, { userId: post.authorId, requestedXp: XP, source: `FORUM_${kind}_MILESTONE`, sourceId: `${postId}:${number}` });
    if (reward.transactionId && reward.grantedXp > 0) await tx.trustMilestone.create({ data: { userId: post.authorId, milestone: name, transactionId: reward.transactionId } });
  }
}

/** Call after a like/comment is removed or invalidated, within the same transaction. */
export async function reverseInvalidEngagementMilestones(tx: Tx, postId: number, kind: Engagement): Promise<void> {
  const post = await lockPost(tx, postId);
  if (!post) return;
  const step = kind === "LIKE" ? 5 : 3;
  const count = await activeUniqueCount(tx, postId, post.authorId, kind);
  const milestones = await tx.trustMilestone.findMany({ where: { userId: post.authorId, milestone: { startsWith: `FORUM_${kind}:${postId}:` } }, include: { transaction: { include: { reversal: true } } } });
  for (const entry of milestones) {
    const number = Number(entry.milestone.split(":").at(-1));
    if (number <= Math.floor(count / step) || entry.transaction.reversal) continue;
    await tx.trustTransaction.create({
      data: { userId: post.authorId, amount: -entry.transaction.amount, type: "REVERSAL", source: `FORUM_${kind}_MILESTONE`, sourceId: `invalidate:${entry.id}`, originalTransactionId: entry.transactionId },
    });
    await tx.user.update({ where: { id: post.authorId }, data: { trustScore: { decrement: entry.transaction.amount } } });
  }
}

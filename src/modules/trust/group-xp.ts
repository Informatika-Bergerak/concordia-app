import type { PrismaClient } from "@/generated/prisma/client";
import { earnDailyXpInTransaction } from "./daily-cap";

export const GROUP_MEMBER_MILESTONE_XP = 10;
export const GROUP_MEMBER_MILESTONE_SIZE = 5;
export const GROUP_MEMBER_ELIGIBILITY_DAYS = 7;

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function rewardGroupMemberMilestones(tx: Tx, groupId: number, now = new Date()): Promise<void> {
  const groups = await tx.$queryRaw<{ creatorId: number }[]>`SELECT "creatorId" FROM "Group" WHERE "id" = ${groupId} FOR UPDATE`;
  const group = groups[0];
  if (!group) return;

  const eligibleSince = new Date(now.getTime() - GROUP_MEMBER_ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000);
  const members = await tx.groupMember.count({ where: { groupId, userId: { not: group.creatorId }, joinedAt: { lte: eligibleSince } } });
  for (let number = 1; number <= Math.floor(members / GROUP_MEMBER_MILESTONE_SIZE); number += 1) {
    const milestone = `GROUP_MEMBER:${groupId}:${number}`;
    if (await tx.trustMilestone.findUnique({ where: { userId_milestone: { userId: group.creatorId, milestone } } })) continue;
    const reward = await earnDailyXpInTransaction(tx, { userId: group.creatorId, requestedXp: GROUP_MEMBER_MILESTONE_XP, source: "GROUP_MEMBER_MILESTONE", sourceId: `${groupId}:${number}`, now });
    if (reward.transactionId && reward.grantedXp > 0) await tx.trustMilestone.create({ data: { userId: group.creatorId, milestone, transactionId: reward.transactionId } });
  }
}

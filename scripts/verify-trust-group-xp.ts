import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { earnDailyXp } from "../src/modules/trust/daily-cap";
import { rewardGroupMemberMilestones } from "../src/modules/trust/group-xp";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const owner = await prisma.user.create({ data: { username: `group-owner-${suffix}`, name: "Owner", passwordHash: "test", userType: "MAHASISWA", isProfilePrivate: true, mustChangePassword: false } });
  const members = await Promise.all(Array.from({ length: 12 }, (_, index) => prisma.user.create({ data: { username: `group-member-${index}-${suffix}`, name: `Member ${index}`, passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } })));
  const group = await prisma.group.create({ data: { name: "Private Group", visibility: "PRIVATE", creatorId: owner.id, members: { create: { userId: owner.id, role: "OWNER" } } } });
  const eligibleAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

  try {
    await prisma.groupMember.createMany({ data: members.slice(0, 5).map((member) => ({ groupId: group.id, userId: member.id, joinedAt: eligibleAt })) });
    await Promise.all([1, 2].map(() => prisma.$transaction((tx) => rewardGroupMemberMilestones(tx, group.id))));
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 10, "five eligible non-owners did not reward exactly once");

    await prisma.groupMember.create({ data: { groupId: group.id, userId: members[5].id } });
    await prisma.$transaction((tx) => rewardGroupMemberMilestones(tx, group.id));
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 10, "fresh member counted before seven days");
    await prisma.groupMember.delete({ where: { groupId_userId: { groupId: group.id, userId: members[0].id } } });
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 10, "ordinary member loss reversed XP");

    await earnDailyXp(prisma, { userId: owner.id, requestedXp: 185, source: "TEST", sourceId: `cap-${suffix}` });
    await prisma.groupMember.createMany({ data: members.slice(6).map((member) => ({ groupId: group.id, userId: member.id, joinedAt: eligibleAt })) });
    await prisma.$transaction((tx) => rewardGroupMemberMilestones(tx, group.id));
    const second = await prisma.trustTransaction.findUniqueOrThrow({ where: { userId_type_source_sourceId: { userId: owner.id, type: "EARN", source: "GROUP_MEMBER_MILESTONE", sourceId: `${group.id}:2` } } });
    console.assert(second.amount === 5, "daily cap did not grant partial group XP");
    console.log("Trust group XP verification passed");
  } finally {
    await prisma.group.delete({ where: { id: group.id } });
    await prisma.trustMilestone.deleteMany({ where: { userId: owner.id } });
    await prisma.trustTransaction.deleteMany({ where: { userId: owner.id } });
    await prisma.trustDailyEarning.deleteMany({ where: { userId: owner.id } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, ...members.map((member) => member.id)] } } });
    await prisma.$disconnect();
  }
}
void main();

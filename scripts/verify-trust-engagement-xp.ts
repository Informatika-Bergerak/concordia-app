import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { rewardEngagementMilestones, reverseInvalidEngagementMilestones } from "../src/modules/trust/engagement-xp";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const owner = await prisma.user.create({ data: { username: `engage-owner-${suffix}`, name: "Owner", passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } });
  const people = await Promise.all(Array.from({ length: 5 }, (_, i) => prisma.user.create({ data: { username: `engage-${i}-${suffix}`, name: `Person ${i}`, passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } })));
  try {
    const post = await prisma.forumPost.create({ data: { authorId: owner.id, text: "Engagement" } });
    for (const person of people) await prisma.$transaction(async (tx) => { await tx.forumPostLike.create({ data: { postId: post.id, userId: person.id } }); await rewardEngagementMilestones(tx, post.id, "LIKE"); });
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 5, "five unique likes did not reward 5 XP");
    await prisma.$transaction(async (tx) => { await tx.forumPostLike.delete({ where: { postId_userId: { postId: post.id, userId: people[0].id } } }); await reverseInvalidEngagementMilestones(tx, post.id, "LIKE"); });
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 0, "unlike did not reverse invalid milestone");
    for (const person of people.slice(0, 3)) await prisma.$transaction(async (tx) => { await tx.forumComment.create({ data: { postId: post.id, authorId: person.id, text: "Comment" } }); await rewardEngagementMilestones(tx, post.id, "COMMENT"); });
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 5, "three unique commenters did not reward 5 XP");
    await prisma.user.update({ where: { id: owner.id }, data: { isProfilePrivate: true } });
    await prisma.$transaction(async (tx) => { await tx.forumComment.create({ data: { postId: post.id, authorId: people[3].id, text: "Private" , trustEligible: false } }); await rewardEngagementMilestones(tx, post.id, "COMMENT"); });
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trustScore === 5, "private engagement generated XP");
    console.log("Trust engagement XP verification passed");
  } finally {
    await prisma.forumPost.deleteMany({ where: { authorId: owner.id } });
    await prisma.trustMilestone.deleteMany({ where: { userId: owner.id } });
    await prisma.trustXpSuspension.deleteMany({ where: { userId: owner.id } });
    await prisma.trustTransaction.deleteMany({ where: { userId: owner.id } });
    await prisma.trustDailyEarning.deleteMany({ where: { userId: owner.id } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, ...people.map((person) => person.id)] } } });
    await prisma.$disconnect();
  }
}
void main();

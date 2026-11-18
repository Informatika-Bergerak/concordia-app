import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { setProfilePrivacy } from "../src/modules/trust/profile-privacy";
import { rewardThreadXp, reverseThreadXp } from "../src/modules/trust/thread-xp";
import { rewardEngagementMilestones } from "../src/modules/trust/engagement-xp";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({ data: { username: `privacy-${suffix}`, name: "Privacy Test", passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } });
  let people: { id: number }[] = [];
  try {
    const thread = await prisma.$transaction(async (tx) => { const post = await tx.forumPost.create({ data: { authorId: user.id, text: "Thread" } }); await rewardThreadXp(tx, user.id, post.id); return post; });
    await prisma.$transaction(async (tx) => { await tx.trustTransaction.create({ data: { userId: user.id, amount: 10, type: "EARN", source: "GROUP", sourceId: suffix } }); await tx.user.update({ where: { id: user.id }, data: { trustScore: { increment: 10 } } }); });
    people = await Promise.all(Array.from({ length: 5 }, (_, index) => prisma.user.create({ data: { username: `privacy-member-${index}-${suffix}`, name: `Member ${index}`, passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } })));
    for (const person of people) await prisma.$transaction(async (tx) => { await tx.forumPostLike.create({ data: { postId: thread.id, userId: person.id } }); await rewardEngagementMilestones(tx, thread.id, "LIKE"); });
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).trustScore === 40, "thread engagement did not earn XP");
    await setProfilePrivacy(prisma, user.id, true);
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).trustScore === 10, "private profile did not suspend all Thread-related XP");
    const privateThread = await prisma.$transaction(async (tx) => { const post = await tx.forumPost.create({ data: { authorId: user.id, text: "Private thread" } }); return rewardThreadXp(tx, user.id, post.id); });
    console.assert(privateThread.grantedXp === 0 && await prisma.trustDailyEarning.count({ where: { userId: user.id } }) === 1, "private Thread earned or used quota");
    await setProfilePrivacy(prisma, user.id, false);
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).trustScore === 40, "public profile did not restore Thread-related XP");
    await setProfilePrivacy(prisma, user.id, true);
    await prisma.$transaction((tx) => reverseThreadXp(tx, user.id, thread.id));
    await setProfilePrivacy(prisma, user.id, false);
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).trustScore === 15, "reversal while suspended restored invalid thread XP");
    await setProfilePrivacy(prisma, user.id, true);
    await setProfilePrivacy(prisma, user.id, false);
    console.assert((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).trustScore === 15, "repeated toggle changed XP incorrectly");
    console.assert(await prisma.trustXpSuspension.count({ where: { earnTransaction: { source: "FORUM_THREAD", sourceId: String(thread.id) } } }) === 2, "each privacy cycle was not recorded");
    console.log("Trust profile privacy verification passed");
  } finally {
    await prisma.forumPost.deleteMany({ where: { authorId: user.id } });
    await prisma.trustMilestone.deleteMany({ where: { userId: user.id } });
    await prisma.trustXpSuspension.deleteMany({ where: { userId: user.id } });
    await prisma.trustTransaction.deleteMany({ where: { userId: user.id } });
    await prisma.trustDailyEarning.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, ...people.map((person) => person.id)] } } });
    await prisma.$disconnect();
  }
}
void main();

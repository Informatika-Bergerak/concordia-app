import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { rewardThreadXp, reverseThreadXp } from "../src/modules/trust/thread-xp";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({ data: { username: `thread-xp-${suffix}`, name: "Thread XP Test", passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } });

  try {
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.forumPost.create({ data: { authorId: user.id, text: "Public thread reward test" } });
      const reward = await rewardThreadXp(tx, user.id, created.id);
      console.assert(reward.grantedXp === 25, "public thread did not earn 25 XP");
      return created;
    });
    const earn = await prisma.trustTransaction.findUniqueOrThrow({ where: { userId_type_source_sourceId: { userId: user.id, type: "EARN", source: "FORUM_THREAD", sourceId: String(post.id) } } });
    console.assert(earn.amount === 25, "thread earning ledger incorrect");

    await prisma.$transaction(async (tx) => { await rewardThreadXp(tx, user.id, post.id); });
    console.assert(await prisma.trustTransaction.count({ where: { userId: user.id, type: "EARN", source: "FORUM_THREAD", sourceId: String(post.id) } }) === 1, "duplicate thread reward created");

    await prisma.$transaction(async (tx) => { await reverseThreadXp(tx, user.id, post.id); });
    await prisma.$transaction(async (tx) => { await reverseThreadXp(tx, user.id, post.id); });
    console.assert(await prisma.trustTransaction.count({ where: { originalTransactionId: earn.id } }) === 1, "duplicate thread reversal created");

    let rolledBack = false;
    try {
      await prisma.$transaction(async (tx) => {
        const failed = await tx.forumPost.create({ data: { authorId: user.id, text: "Rollback test" } });
        await rewardThreadXp(tx, user.id, failed.id);
        throw new Error("rollback");
      });
    } catch { rolledBack = true; }
    console.assert(rolledBack && await prisma.forumPost.count({ where: { authorId: user.id, text: "Rollback test" } }) === 0, "failed thread transaction was not rolled back");
    console.log("Trust thread XP verification passed");
  } finally {
    await prisma.forumPost.deleteMany({ where: { authorId: user.id } });
    await prisma.trustTransaction.deleteMany({ where: { userId: user.id } });
    await prisma.trustDailyEarning.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

void main();

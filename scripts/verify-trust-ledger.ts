import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({ data: { username: `trust-${suffix}`, name: "Trust Ledger Test", passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } });

  try {
  const earn = await prisma.$transaction(async (tx) => {
    const transaction = await tx.trustTransaction.create({ data: { userId: user.id, amount: 10, type: "EARN", source: "TEST", sourceId: `earn-${suffix}` } });
    await tx.user.update({ where: { id: user.id }, data: { trustScore: { increment: 10 } } });
    return transaction;
  });
  let duplicateBlocked = false;
  try { await prisma.trustTransaction.create({ data: { userId: user.id, amount: 10, type: "EARN", source: "TEST", sourceId: `earn-${suffix}` } }); } catch { duplicateBlocked = true; }
  const reversal = await prisma.$transaction(async (tx) => {
    const transaction = await tx.trustTransaction.create({ data: { userId: user.id, amount: -10, type: "REVERSAL", source: "TEST", sourceId: `reversal-${suffix}`, originalTransactionId: earn.id } });
    await tx.user.update({ where: { id: user.id }, data: { trustScore: { decrement: 10 } } });
    return transaction;
  });
  let duplicateReversalBlocked = false;
  try { await prisma.trustTransaction.create({ data: { userId: user.id, amount: -10, type: "REVERSAL", source: "TEST", sourceId: `reversal-second-${suffix}`, originalTransactionId: earn.id } }); } catch { duplicateReversalBlocked = true; }
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.trustTransaction.create({ data: { userId: user.id, amount: 5, type: "EARN", source: "TEST", sourceId: `milestone-${suffix}` } });
    await tx.user.update({ where: { id: user.id }, data: { trustScore: { increment: 5 } } });
    await tx.trustMilestone.create({ data: { userId: user.id, milestone: "TEST_MILESTONE", transactionId: transaction.id } });
  });
  let duplicateMilestoneBlocked = false;
  try { await prisma.trustMilestone.create({ data: { userId: user.id, milestone: "TEST_MILESTONE", transactionId: reversal.id } }); } catch { duplicateMilestoneBlocked = true; }
  console.assert(duplicateBlocked && duplicateReversalBlocked && duplicateMilestoneBlocked, "Unique constraints did not reject duplicate data");
  console.log("Trust ledger verification passed");
} finally {
  await prisma.trustMilestone.deleteMany({ where: { userId: user.id } });
  await prisma.trustTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

void main();

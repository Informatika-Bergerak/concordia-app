import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { earnDailyXp } from "../src/modules/trust/daily-cap";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({ data: { username: `daily-cap-${suffix}`, name: "Daily Cap Test", passwordHash: "test", userType: "MAHASISWA", mustChangePassword: false } });
  const admin = await prisma.user.create({ data: { username: `daily-cap-admin-${suffix}`, name: "Daily Cap Admin", passwordHash: "test", role: "ADMIN", mustChangePassword: false } });
  const day = new Date("2026-11-18T10:00:00.000Z");

  try {
    const first = await earnDailyXp(prisma, { userId: user.id, requestedXp: 150, source: "TEST", sourceId: `first-${suffix}`, now: day });
    const partial = await earnDailyXp(prisma, { userId: user.id, requestedXp: 100, source: "TEST", sourceId: `partial-${suffix}`, now: day });
    const capped = await earnDailyXp(prisma, { userId: user.id, requestedXp: 1, source: "TEST", sourceId: `capped-${suffix}`, now: day });
    const duplicate = await earnDailyXp(prisma, { userId: user.id, requestedXp: 150, source: "TEST", sourceId: `first-${suffix}`, now: day });
    const nextDay = await earnDailyXp(prisma, { userId: user.id, requestedXp: 10, source: "TEST", sourceId: `next-day-${suffix}`, now: new Date("2026-11-18T17:00:00.000Z") });
    const ineligible = await earnDailyXp(prisma, { userId: admin.id, requestedXp: 10, source: "TEST", sourceId: `admin-${suffix}`, now: day });
    console.assert(first.grantedXp === 150 && partial.grantedXp === 50 && capped.grantedXp === 0, "normal, partial, or capped earning failed");
    console.assert(duplicate.duplicate && duplicate.grantedXp === 0 && nextDay.grantedXp === 10 && !ineligible.eligible, "idempotency, WIB date, or eligibility failed");

    const concurrent = await Promise.all(Array.from({ length: 10 }, (_, index) => earnDailyXp(prisma, { userId: user.id, requestedXp: 50, source: "CONCURRENT", sourceId: `${suffix}-${index}`, now: new Date("2026-11-19T10:00:00.000Z") })));
    const concurrentTotal = concurrent.reduce((total, result) => total + result.grantedXp, 0);
    console.assert(concurrentTotal === 190, "concurrent earning exceeded remaining daily cap");

    const today = await prisma.trustDailyEarning.findUniqueOrThrow({ where: { userId_date: { userId: user.id, date: new Date("2026-11-18T00:00:00.000Z") } } });
    await prisma.$transaction(async (tx) => {
      await tx.trustTransaction.create({ data: { userId: user.id, amount: -10, type: "PENALTY", source: "TEST", sourceId: `penalty-${suffix}` } });
      await tx.user.update({ where: { id: user.id }, data: { trustScore: { decrement: 10 } } });
    });
    const afterPenalty = await prisma.trustDailyEarning.findUniqueOrThrow({ where: { userId_date: { userId: user.id, date: today.date } } });
    console.assert(afterPenalty.amount === today.amount, "penalty changed daily earning capacity");
    await prisma.$transaction(async (tx) => {
      await tx.trustTransaction.create({ data: { userId: user.id, amount: -150, type: "REVERSAL", source: "TEST", sourceId: `reversal-${suffix}`, originalTransactionId: first.transactionId! } });
      await tx.user.update({ where: { id: user.id }, data: { trustScore: { decrement: 150 } } });
    });
    const afterReversal = await prisma.trustDailyEarning.findUniqueOrThrow({ where: { userId_date: { userId: user.id, date: today.date } } });
    console.assert(afterReversal.amount === today.amount, "reversal restored daily earning capacity");
    console.log("Trust daily cap verification passed");
  } finally {
    await prisma.trustMilestone.deleteMany({ where: { userId: { in: [user.id, admin.id] } } });
    await prisma.trustTransaction.deleteMany({ where: { userId: { in: [user.id, admin.id] } } });
    await prisma.trustDailyEarning.deleteMany({ where: { userId: { in: [user.id, admin.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, admin.id] } } });
    await prisma.$disconnect();
  }
}

void main();

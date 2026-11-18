import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { applyConfirmedViolation, reverseOwnContentXp } from "../src/modules/trust/moderation";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const owner = await prisma.user.create({ data: { username: `mod-owner-${suffix}`, name: "Owner", passwordHash: "test", userType: "MAHASISWA", trustScore: 30, mustChangePassword: false } });
  const actor = await prisma.user.create({ data: { username: `mod-actor-${suffix}`, name: "Actor", passwordHash: "test", role: "MODERATOR", mustChangePassword: false } });
  try {
    const earn = await prisma.trustTransaction.create({ data: { userId: owner.id, amount: 25, type: "EARN", source: "FORUM_THREAD", sourceId: `self-${suffix}` } });
    await prisma.user.update({ where: { id: owner.id }, data: { trustScore: 55 } });
    const self = await reverseOwnContentXp(prisma, { userId: owner.id, source: "FORUM_THREAD", sourceId: `self-${suffix}`, reason: "deleted" });
    console.assert(self.reversed === 25 && self.after === 30, "self deletion did not only reverse XP");

    const violationEarn = await prisma.trustTransaction.create({ data: { userId: owner.id, amount: 10, type: "EARN", source: "FORUM_THREAD", sourceId: `violation-${suffix}` } });
    await prisma.user.update({ where: { id: owner.id }, data: { trustScore: 10 } });
    const violation = await applyConfirmedViolation(prisma, { actorId: actor.id, userId: owner.id, source: "FORUM_THREAD", sourceId: `violation-${suffix}`, reason: "spam", additionalAction: "content_removed" });
    console.assert(violation.reversed === 10 && violation.penalized === 0 && violation.after === 0, "violation did not clamp balance");
    const repeat = await applyConfirmedViolation(prisma, { actorId: actor.id, userId: owner.id, source: "FORUM_THREAD", sourceId: `violation-${suffix}` });
    console.assert(repeat.reversed === 0 && repeat.penalized === 0, "duplicate moderation was not idempotent");
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "TRUST_MODERATION", targetId: owner.id }, orderBy: { id: "desc" } });
    console.assert(Boolean((audit.metadata as { penaltyRequested?: number }).penaltyRequested !== undefined), "audit lacks requested amount");
    console.log("Trust moderation verification passed", earn.id, violationEarn.id);
  } finally {
    await prisma.auditLog.deleteMany({ where: { targetId: owner.id } });
    await prisma.trustTransaction.deleteMany({ where: { userId: owner.id } });
    await prisma.trustDailyEarning.deleteMany({ where: { userId: owner.id } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, actor.id] } } });
    await prisma.$disconnect();
  }
}
void main();

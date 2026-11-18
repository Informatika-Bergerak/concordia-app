import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

const THREAD_SOURCE = "FORUM_THREAD";

export async function setProfilePrivacy(db: PrismaClient, userId: number, isPrivate: boolean): Promise<void> {
  await db.$transaction((tx) => setProfilePrivacyInTransaction(tx, userId, isPrivate));
}

export async function setProfilePrivacyInTransaction(tx: Tx, userId: number, isPrivate: boolean): Promise<void> {
  const users = await tx.$queryRaw<{ isProfilePrivate: boolean }[]>`
    SELECT "isProfilePrivate" FROM "User" WHERE "id" = ${userId} FOR UPDATE
  `;
  const user = users[0];
  if (!user || user.isProfilePrivate === isPrivate) return;

  if (isPrivate) {
    const earnings = await tx.trustTransaction.findMany({
      where: { userId, type: "EARN", source: THREAD_SOURCE, reversal: null, suspensionEarnings: { none: { restorationTransactionId: null } } },
    });
    let total = 0;
    for (const earn of earnings) {
      const cycle = await tx.trustXpSuspension.count({ where: { earnTransactionId: earn.id } });
      const suspension = await tx.trustTransaction.create({
        data: { userId, amount: -earn.amount, type: "SUSPENSION", source: THREAD_SOURCE, sourceId: `suspend:${earn.id}:${cycle + 1}` },
      });
      await tx.trustXpSuspension.create({ data: { userId, earnTransactionId: earn.id, suspensionTransactionId: suspension.id } });
      total += earn.amount;
    }
    if (total) await tx.user.update({ where: { id: userId }, data: { isProfilePrivate: true, trustScore: { decrement: total } } });
    else await tx.user.update({ where: { id: userId }, data: { isProfilePrivate: true } });
    return;
  }

  const suspended = await tx.trustXpSuspension.findMany({
    where: { userId, restorationTransactionId: null, earnTransaction: { reversal: null } },
    include: { earnTransaction: true },
  });
  let total = 0;
  for (const item of suspended) {
    const restoration = await tx.trustTransaction.create({
      data: { userId, amount: item.earnTransaction.amount, type: "RESTORATION", source: THREAD_SOURCE, sourceId: `restore:${item.id}` },
    });
    await tx.trustXpSuspension.update({ where: { id: item.id }, data: { restorationTransactionId: restoration.id, restoredAt: new Date() } });
    total += item.earnTransaction.amount;
  }
  if (total) await tx.user.update({ where: { id: userId }, data: { isProfilePrivate: false, trustScore: { increment: total } } });
  else await tx.user.update({ where: { id: userId }, data: { isProfilePrivate: false } });
}

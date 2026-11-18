import type { PrismaClient } from "@/generated/prisma/client";

export const DAILY_XP_CAP = 200;

type Db = PrismaClient;
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export type EarnXpInput = {
  userId: number;
  requestedXp: number;
  source: string;
  sourceId: string;
  now?: Date;
};

export type EarnXpResult = {
  grantedXp: number;
  remainingXp: number;
  transactionId: number | null;
  duplicate: boolean;
  eligible: boolean;
};

export function jakartaDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00.000Z`);
}

function requestedXp(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export async function earnDailyXp(db: Db, input: EarnXpInput): Promise<EarnXpResult> {
  return db.$transaction((tx) => earnDailyXpInTransaction(tx, input));
}

export async function earnDailyXpInTransaction(tx: Tx, input: EarnXpInput): Promise<EarnXpResult> {
  const requested = requestedXp(input.requestedXp);
  const date = jakartaDate(input.now);

    // Serializes all reward decisions for this user, including the first row of a day.
    const users = await tx.$queryRaw<{ role: "USER" | "MODERATOR" | "ADMIN"; userType: string | null }[]>`
      SELECT "role", "userType" FROM "User" WHERE "id" = ${input.userId} FOR UPDATE
    `;
    const user = users[0];
    const eligible = user?.role === "MODERATOR" || (user?.role === "USER" && user.userType !== null);
    if (!eligible) return { grantedXp: 0, remainingXp: 0, transactionId: null, duplicate: false, eligible: false };

    const existing = await tx.trustTransaction.findUnique({
      where: { userId_type_source_sourceId: { userId: input.userId, type: "EARN", source: input.source, sourceId: input.sourceId } },
    });
    const daily = await tx.trustDailyEarning.findUnique({ where: { userId_date: { userId: input.userId, date } } });
    const remaining = DAILY_XP_CAP - (daily?.amount ?? 0);
    if (existing) return { grantedXp: 0, remainingXp: remaining, transactionId: existing.id, duplicate: true, eligible: true };

    const grantedXp = Math.min(requested, remaining);
    if (grantedXp === 0) return { grantedXp: 0, remainingXp: remaining, transactionId: null, duplicate: false, eligible: true };

    const transaction = await tx.trustTransaction.create({
      data: { userId: input.userId, amount: grantedXp, type: "EARN", source: input.source, sourceId: input.sourceId },
    });
    await tx.user.update({ where: { id: input.userId }, data: { trustScore: { increment: grantedXp } } });
    await tx.trustDailyEarning.upsert({
      where: { userId_date: { userId: input.userId, date } },
      create: { userId: input.userId, date, amount: grantedXp },
      update: { amount: { increment: grantedXp } },
    });

    return { grantedXp, remainingXp: remaining - grantedXp, transactionId: transaction.id, duplicate: false, eligible: true };
}

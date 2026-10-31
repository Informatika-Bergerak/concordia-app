import { prisma } from "@/lib/db";

type Rule = { max: number; windowMs: number; lockMs: number };

const MINUTE = 60 * 1000;

const USER_RULE: Rule = { max: 5, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE };
const IP_RULE: Rule = { max: 50, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE };

export type ThrottleKeys = { user: string; ip: string | null };

export function getIpFromHeaders(h: { get(name: string): string | null }): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export function getClientIp(request: Request | undefined): string {
  return request ? getIpFromHeaders(request.headers) : "unknown";
}

export function buildKeys(username: string, ip: string): ThrottleKeys {
  return {
    user: `u:${username}`,
    // Jika IP tidak diketahui, aturan IP dilewati supaya semua orang tidak
    // berbagi satu "keranjang" yang sama dan saling mengunci
    ip: ip === "unknown" ? null : `ip:${ip}`,
  };
}

export async function isLocked(keys: ThrottleKeys): Promise<boolean> {
  const list = [keys.user, keys.ip].filter((k): k is string => k !== null);
  const count = await prisma.loginThrottle.count({
    where: { key: { in: list }, lockedUntil: { gt: new Date() } },
  });
  return count > 0;
}

async function bump(key: string, rule: Rule): Promise<boolean> {
  const now = new Date();

  const row = await prisma.loginThrottle.upsert({
    where: { key },
    create: { key, attempts: 1, windowStart: now },
    update: { attempts: { increment: 1 } },
  });

  // Jendela waktu sudah lewat: mulai hitungan baru
  if (now.getTime() - row.windowStart.getTime() > rule.windowMs) {
    await prisma.loginThrottle.update({
      where: { key },
      data: { attempts: 1, windowStart: now, lockedUntil: null },
    });
    return false;
  }

  if (row.attempts >= rule.max) {
    await prisma.loginThrottle.update({
      where: { key },
      data: { lockedUntil: new Date(now.getTime() + rule.lockMs) },
    });
    return true;
  }

  return false;
}

// Mengembalikan true jika percobaan gagal ini membuat salah satu kunci terkunci
export async function recordFailure(keys: ThrottleKeys): Promise<boolean> {
  const userLocked = await bump(keys.user, USER_RULE);
  const ipLocked = keys.ip ? await bump(keys.ip, IP_RULE) : false;
  return userLocked || ipLocked;
}

export async function clearFailures(username: string): Promise<void> {
  await prisma.loginThrottle.deleteMany({ where: { key: `u:${username}` } });
}
export type TrustRole = "USER" | "MODERATOR" | "ADMIN";

export type TrustProgress = {
  level: number;
  levelXp: number;
  nextLevelXp: number;
  currentLevelXp: number;
  remainingXp: number;
  percentage: number;
};

function normalizeXp(totalXp: number): number {
  if (!Number.isFinite(totalXp) || totalXp <= 0) return 0;
  return Math.min(Math.floor(totalXp), Number.MAX_SAFE_INTEGER);
}

/** XP total minimum untuk mencapai level tertentu. */
export function xpForLevel(level: number): number {
  const safeLevel = Number.isFinite(level) && level > 0 ? Math.floor(level) : 0;
  return Math.min(25 * safeLevel * (safeLevel + 3), Number.MAX_SAFE_INTEGER);
}

/** Level yang dicapai berdasarkan total XP. */
export function levelForXp(totalXp: number): number {
  const xp = normalizeXp(totalXp);
  let level = Math.floor((Math.sqrt(9 + xp / 25) - 3) / 2);

  while (xpForLevel(level + 1) <= xp) level += 1;
  while (xpForLevel(level) > xp) level -= 1;
  return level;
}

export function currentLevelXp(totalXp: number): number {
  return xpForLevel(levelForXp(totalXp));
}

export function nextLevelXp(totalXp: number): number {
  return xpForLevel(levelForXp(totalXp) + 1);
}

export function xpProgress(totalXp: number): number {
  return normalizeXp(totalXp) - currentLevelXp(totalXp);
}

export function xpRemaining(totalXp: number): number {
  return nextLevelXp(totalXp) - normalizeXp(totalXp);
}

function percentage(progress: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(100, Math.max(0, (progress / required) * 100));
}

export function progressPercentage(totalXp: number): number {
  const current = currentLevelXp(totalXp);
  const next = nextLevelXp(totalXp);
  return percentage(xpProgress(totalXp), next - current);
}

export function getTrustProgress(totalXp: number): TrustProgress {
  const level = levelForXp(totalXp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const progress = normalizeXp(totalXp) - current;

  return {
    level,
    levelXp: normalizeXp(totalXp),
    currentLevelXp: current,
    nextLevelXp: next,
    remainingXp: next - normalizeXp(totalXp),
    percentage: percentage(progress, next - current),
  };
}

export function isTrustEligible(role: TrustRole): boolean {
  return role !== "ADMIN";
}

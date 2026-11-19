import { describe, expect, it } from "vitest";
import {
  currentLevelXp,
  getTrustProgress,
  isTrustEligible,
  levelForXp,
  nextLevelXp,
  progressPercentage,
  xpForLevel,
  xpProgress,
  xpRemaining,
} from "../src/modules/trust/progression";

describe("Trust Level progression", () => {
  it("mengikuti formula threshold total XP", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(250);
    expect(xpForLevel(3)).toBe(450);
    expect(xpForLevel(10)).toBe(3250);
  });

  it("menghitung level tepat pada dan sebelum threshold", () => {
    expect(levelForXp(0)).toBe(0);
    expect(levelForXp(99)).toBe(0);
    expect(levelForXp(100)).toBe(1);
    expect(levelForXp(249)).toBe(1);
    expect(levelForXp(250)).toBe(2);
    expect(levelForXp(450)).toBe(3);
  });

  it("menghitung progress level 0 dan level berikutnya", () => {
    expect(getTrustProgress(0)).toEqual({ level: 0, levelXp: 0, currentLevelXp: 0, nextLevelXp: 100, remainingXp: 100, percentage: 0 });
    expect(getTrustProgress(50)).toEqual({ level: 0, levelXp: 50, currentLevelXp: 0, nextLevelXp: 100, remainingXp: 50, percentage: 50 });
    expect(getTrustProgress(175)).toEqual({ level: 1, levelXp: 175, currentLevelXp: 100, nextLevelXp: 250, remainingXp: 75, percentage: 50 });
  });

  it("mengembalikan progress nol saat tepat naik level", () => {
    expect(currentLevelXp(250)).toBe(250);
    expect(nextLevelXp(250)).toBe(450);
    expect(xpProgress(250)).toBe(0);
    expect(xpRemaining(250)).toBe(200);
    expect(progressPercentage(250)).toBe(0);
  });

  it("menangani XP tinggi tanpa progress invalid", () => {
    const xp = xpForLevel(10_000) + 123;
    const progress = getTrustProgress(xp);
    expect(progress.level).toBe(10_000);
    expect(progress.currentLevelXp).toBe(xpForLevel(10_000));
    expect(progress.percentage).toBeGreaterThanOrEqual(0);
    expect(progress.percentage).toBeLessThan(100);
  });

  it("menormalkan input invalid ke XP nol", () => {
    for (const value of [-1, -100, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(getTrustProgress(value)).toEqual(getTrustProgress(0));
    }
    expect(xpForLevel(-1)).toBe(0);
    expect(xpForLevel(Number.NaN)).toBe(0);
  });

  it("mengecualikan ADMIN dari Trust Level", () => {
    expect(isTrustEligible("USER")).toBe(true);
    expect(isTrustEligible("MODERATOR")).toBe(true);
    expect(isTrustEligible("ADMIN")).toBe(false);
  });
});

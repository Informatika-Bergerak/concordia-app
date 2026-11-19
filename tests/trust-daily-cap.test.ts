import { describe, expect, it } from "vitest";
import { DAILY_XP_CAP, jakartaDate } from "../src/modules/trust/daily-cap";

describe("Trust daily cap helpers", () => {
  it("menetapkan daily cap global sebesar 200 XP", () => {
    expect(DAILY_XP_CAP).toBe(200);
  });

  it("menggunakan tanggal Asia/Jakarta", () => {
    expect(jakartaDate(new Date("2026-11-18T16:59:59.000Z")).toISOString()).toBe("2026-11-18T00:00:00.000Z");
    expect(jakartaDate(new Date("2026-11-18T17:00:00.000Z")).toISOString()).toBe("2026-11-19T00:00:00.000Z");
  });
});

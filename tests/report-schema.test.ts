import { describe, expect, it } from "vitest";
import { createReportSchema } from "../src/modules/report/schemas";

const valid = {
  title: "Lampu koridor mati",
  description: "Lampu di koridor lantai 2 mati sejak kemarin",
  location: "Gedung A lantai 2",
  category: "FASILITAS",
  occurredAt: "2026-10-11",
  visibility: "PUBLIC",
};

describe("createReportSchema", () => {
  it("menerima data yang valid", () => {
    expect(createReportSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak topik terlalu pendek", () => {
    expect(createReportSchema.safeParse({ ...valid, title: "abc" }).success).toBe(false);
  });

  it("menolak kategori di luar daftar", () => {
    expect(createReportSchema.safeParse({ ...valid, category: "RANDOM" }).success).toBe(false);
  });

  it("menolak tanggal di masa depan", () => {
    expect(createReportSchema.safeParse({ ...valid, occurredAt: "2999-01-01" }).success).toBe(false);
  });

  it("menerima visibilitas Anonymous", () => {
    expect(createReportSchema.safeParse({ ...valid, visibility: "ANONYMOUS" }).success).toBe(true);
  });

  it("menolak visibilitas yang tidak dikenal", () => {
    expect(createReportSchema.safeParse({ ...valid, visibility: "SECRET" }).success).toBe(false);
  });
});

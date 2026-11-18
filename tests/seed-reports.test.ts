import { describe, expect, it } from "vitest";
import { seedReports } from "../prisma/seed-reports";
import { canChangeStatus } from "../src/modules/report/rules";

// Prisma palsu: cukup untuk memeriksa isi dan sifat idempoten seeder tanpa database.
type Created = {
  slug: string;
  authorId: number;
  status: string;
  visibility: string;
  category: string;
  rejectionReason: string | null;
  history: { create: { fromStatus: string | null; toStatus: string; changedById: number | null }[] };
  supports: { createMany: { data: { userId: number }[] } };
};

function fakePrisma(knownUsernames: (u: string) => boolean = () => true) {
  const ids = new Map<string, number>();
  const idFor = (u: string) => {
    if (!ids.has(u)) ids.set(u, ids.size + 1);
    return ids.get(u)!;
  };
  const created: Created[] = [];
  const prisma = {
    user: {
      findMany: async ({ where }: { where: { username: { in: string[] } } }) =>
        where.username.in.filter(knownUsernames).map((username) => ({ id: idFor(username), username })),
    },
    report: {
      findUnique: async ({ where }: { where: { slug: string } }) =>
        created.find((r) => r.slug === where.slug) ? { id: 1 } : null,
      create: async ({ data }: { data: Created }) => {
        created.push(data);
        return data;
      },
    },
  };
  return { prisma: prisma as never, created, idFor };
}

describe("seedReports", () => {
  it("membuat laporan contoh dengan slug unik", async () => {
    const { prisma, created } = fakePrisma();
    await seedReports(prisma);
    expect(created.length).toBeGreaterThanOrEqual(12);
    expect(new Set(created.map((r) => r.slug)).size).toBe(created.length);
    for (const r of created) expect(r.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("mencakup semua status dan visibilitas, serta laporan dosen dan moderator", async () => {
    const { prisma, created, idFor } = fakePrisma();
    await seedReports(prisma);
    expect(new Set(created.map((r) => r.status))).toEqual(
      new Set(["UNVERIFIED", "VERIFIED", "IN_PROGRESS", "RESOLVED", "REJECTED"]),
    );
    expect(new Set(created.map((r) => r.visibility))).toEqual(
      new Set(["PUBLIC", "ANONYMOUS", "PRIVATE"]),
    );
    expect(created.some((r) => r.authorId === idFor("0411058501"))).toBe(true);
    expect(created.some((r) => r.authorId === idFor("moderator"))).toBe(true);
  });

  it("laporan moderator selalu Public", async () => {
    const { prisma, created, idFor } = fakePrisma();
    await seedReports(prisma);
    const moderatorReports = created.filter((r) => r.authorId === idFor("moderator"));
    expect(moderatorReports.length).toBeGreaterThan(0);
    expect(moderatorReports.every((r) => r.visibility === "PUBLIC")).toBe(true);
  });

  it("dukungan tidak berasal dari pelapor sendiri dan tidak untuk laporan Private atau ditolak", async () => {
    const { prisma, created } = fakePrisma();
    await seedReports(prisma);
    for (const r of created) {
      const supporters = r.supports.createMany.data.map((d) => d.userId);
      expect(supporters).not.toContain(r.authorId);
      expect(new Set(supporters).size).toBe(supporters.length);
      if (r.visibility === "PRIVATE" || r.status === "REJECTED") expect(supporters).toHaveLength(0);
    }
  });

  it("riwayat status sesuai status akhir, dan penolakan memuat alasan", async () => {
    const { prisma, created } = fakePrisma();
    await seedReports(prisma);
    for (const r of created) {
      const history = r.history.create;
      expect(history[0]).toMatchObject({ fromStatus: null, toStatus: "UNVERIFIED" });
      expect(history.at(-1)?.toStatus).toBe(r.status);
      if (r.status === "REJECTED") expect(r.rejectionReason).toBeTruthy();
      else expect(r.rejectionReason).toBeNull();
    }
  });

  it("setiap perpindahan status pada riwayat mengikuti aturan alur penanganan", async () => {
    const { prisma, created } = fakePrisma();
    await seedReports(prisma);
    for (const r of created) {
      const history = r.history.create;
      for (let i = 1; i < history.length; i++) {
        expect(canChangeStatus(history[i].fromStatus as never, history[i].toStatus as never)).toBe(true);
        expect(history[i].fromStatus).toBe(history[i - 1].toStatus);
      }
    }
  });

  it("aman dijalankan berulang: tidak membuat laporan ganda", async () => {
    const { prisma, created } = fakePrisma();
    await seedReports(prisma);
    const first = created.length;
    await seedReports(prisma);
    expect(created.length).toBe(first);
  });

  it("melewati laporan bila akun pelapor belum ada", async () => {
    const { prisma, created } = fakePrisma((u) => u !== "moderator");
    await seedReports(prisma);
    expect(created.some((r) => r.visibility === "PUBLIC")).toBe(true);
    const all = fakePrisma();
    await seedReports(all.prisma);
    expect(created.length).toBeLessThan(all.created.length);
  });
});

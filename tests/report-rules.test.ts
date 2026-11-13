import { describe, expect, it } from "vitest";
import {
  canChangeStatus,
  canViewReport,
  requiresNote,
  toAdminReportItem,
  toReportDetail,
  toReportItem,
  type ReportRow,
} from "../src/modules/report/rules";
import {
  createReportInputSchema,
  reportPhotoSchema,
  updateReportStatusSchema,
} from "../src/modules/report/schemas";

const row: ReportRow = {
  id: 7,
  title: "Lampu koridor mati",
  description: "Lampu di koridor lantai 2 mati sejak kemarin",
  location: "Gedung A lantai 2",
  category: "FASILITAS",
  status: "UNVERIFIED",
  visibility: "PUBLIC",
  occurredAt: new Date("2026-10-11T00:00:00.000Z"),
  authorId: 1,
  author: { name: "Muhamad Gilang" },
  photos: [],
};

describe("toReportItem", () => {
  it("menampilkan nama pelapor untuk laporan Public", () => {
    expect(toReportItem(row, 2).authorName).toBe("Muhamad Gilang");
  });

  it("menyembunyikan nama pelapor untuk laporan Anonymous, bahkan untuk pemiliknya", () => {
    const anon = { ...row, visibility: "ANONYMOUS" as const };
    expect(toReportItem(anon, 2).authorName).toBeNull();
    expect(toReportItem(anon, 1).authorName).toBeNull();
  });

  it("tidak membocorkan nama lewat hasil serialisasi", () => {
    const anon = { ...row, visibility: "ANONYMOUS" as const };
    expect(JSON.stringify(toReportItem(anon, 2))).not.toContain("Gilang");
  });

  it("menandai laporan milik sendiri dan memformat tanggal", () => {
    const item = toReportItem(row, 1);
    expect(item.isMine).toBe(true);
    expect(item.occurredAt).toBe("2026-10-11");
    expect(toReportItem(row, 99).isMine).toBe(false);
  });

  it("memakai foto pertama sebagai cover", () => {
    const item = toReportItem({ ...row, photos: [{ url: "https://res.cloudinary.com/x/a.jpg" }] }, 1);
    expect(item.coverImage).toBe("https://res.cloudinary.com/x/a.jpg");
  });
});

describe("canViewReport", () => {
  const priv = { visibility: "PRIVATE" as const, authorId: 1 };
  it("Private hanya untuk pelapor dan admin", () => {
    expect(canViewReport({ id: 1, role: "USER" }, priv)).toBe(true);
    expect(canViewReport({ id: 2, role: "ADMIN" }, priv)).toBe(true);
    expect(canViewReport({ id: 2, role: "USER" }, priv)).toBe(false);
    expect(canViewReport({ id: 3, role: "MODERATOR" }, priv)).toBe(false);
  });

  it("Public dan Anonymous terlihat oleh semua pengguna", () => {
    expect(canViewReport({ id: 2, role: "USER" }, { visibility: "PUBLIC", authorId: 1 })).toBe(true);
    expect(canViewReport({ id: 2, role: "USER" }, { visibility: "ANONYMOUS", authorId: 1 })).toBe(true);
  });
});

describe("aturan status", () => {
  it("menolak perubahan ke status yang sama", () => {
    expect(canChangeStatus("UNVERIFIED", "UNVERIFIED")).toBe(false);
    expect(canChangeStatus("UNVERIFIED", "VERIFIED")).toBe(true);
  });

  it("penolakan wajib memakai alasan", () => {
    expect(requiresNote("REJECTED")).toBe(true);
    expect(requiresNote("VERIFIED")).toBe(false);
    expect(updateReportStatusSchema.safeParse({ reportId: 1, status: "REJECTED" }).success).toBe(false);
    expect(
      updateReportStatusSchema.safeParse({ reportId: 1, status: "REJECTED", note: "Foto tidak sesuai" }).success,
    ).toBe(true);
    expect(updateReportStatusSchema.safeParse({ reportId: 1, status: "VERIFIED" }).success).toBe(true);
  });
});

describe("validasi foto laporan", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  const publicId = `concordia/reports/${id}`;
  const photo = { url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`, publicId, bytes: 1000 };

  it("menerima metadata hasil upload yang sah", () => {
    expect(reportPhotoSchema.safeParse(photo).success).toBe(true);
  });

  it("menolak URL dari host lain", () => {
    expect(reportPhotoSchema.safeParse({ ...photo, url: `https://evil.example/${publicId}.jpg` }).success).toBe(false);
  });

  it("menolak publicId dari folder lain", () => {
    const other = `concordia/avatars/${id}`;
    expect(reportPhotoSchema.safeParse({ ...photo, publicId: other, url: `https://res.cloudinary.com/demo/${other}.jpg` }).success).toBe(false);
  });

  it("menolak URL yang tidak memuat publicId", () => {
    expect(reportPhotoSchema.safeParse({ ...photo, url: "https://res.cloudinary.com/demo/other.jpg" }).success).toBe(false);
  });

  it("foto bersifat opsional pada input laporan", () => {
    const base = {
      title: "Lampu koridor mati",
      description: "Lampu di koridor lantai 2 mati sejak kemarin",
      location: "Gedung A",
      category: "FASILITAS",
      occurredAt: "2026-10-11",
      visibility: "PUBLIC",
    };
    expect(createReportInputSchema.safeParse(base).success).toBe(true);
    expect(createReportInputSchema.safeParse({ ...base, photo: null }).success).toBe(true);
  });
});

describe("toReportDetail dan toAdminReportItem", () => {
  const detailRow = {
    ...row,
    rejectionReason: "Foto tidak sesuai",
    photos: [{ url: "https://res.cloudinary.com/demo/a.jpg" }],
    history: [
      {
        fromStatus: null,
        toStatus: "UNVERIFIED" as const,
        note: null,
        createdAt: new Date("2026-10-11T03:00:00.000Z"),
      },
    ],
  };

  it("pelapor dan admin melihat alasan penolakan dan riwayat status", () => {
    const own = toReportDetail(detailRow, { id: 1, role: "USER" });
    expect(own.rejectionReason).toBe("Foto tidak sesuai");
    expect(own.history).toHaveLength(1);

    const admin = toReportDetail(detailRow, { id: 9, role: "ADMIN" });
    expect(admin.rejectionReason).toBe("Foto tidak sesuai");
    expect(admin.history).toHaveLength(1);
  });

  it("pengguna lain tidak menerima alasan penolakan maupun riwayat", () => {
    const other = toReportDetail(detailRow, { id: 2, role: "USER" });
    expect(other.rejectionReason).toBeNull();
    expect(other.history).toEqual([]);
  });

  it("detail laporan Anonymous tidak membocorkan nama pelapor", () => {
    const anon = { ...detailRow, visibility: "ANONYMOUS" as const };
    expect(JSON.stringify(toReportDetail(anon, { id: 2, role: "USER" }))).not.toContain("Gilang");
    expect(JSON.stringify(toReportDetail(anon, { id: 1, role: "USER" }))).not.toContain("Gilang");
  });

  it("admin melihat identitas pelapor laporan Anonymous", () => {
    const item = toAdminReportItem(
      {
        ...row,
        visibility: "ANONYMOUS",
        rejectionReason: null,
        createdAt: new Date("2026-10-11T03:00:00.000Z"),
        author: { name: "Muhamad Gilang", username: "2113231092" },
      },
      9,
    );
    expect(item.authorName).toBe("Muhamad Gilang");
    expect(item.authorUsername).toBe("2113231092");
    expect(item.visibility).toBe("ANONYMOUS");
  });
});

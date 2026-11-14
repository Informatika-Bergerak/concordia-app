import { describe, expect, it } from "vitest";
import {
  canChangeStatus,
  canViewReport,
  canCreateReport,
  requiresNote,
  supportBlockReason,
  toAdminReportItem,
  toReportDetail,
  toReportItem,
  type ReportRow,
} from "../src/modules/report/rules";
import {
  createReportInputSchema,
  reportPhotoSchema,
  supportReportSchema,
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
    expect(canViewReport({ id: 1, role: "MODERATOR" }, priv)).toBe(true);
  });

  it("Public dan Anonymous terlihat oleh semua pengguna", () => {
    expect(canViewReport({ id: 2, role: "USER" }, { visibility: "PUBLIC", authorId: 1 })).toBe(true);
    expect(canViewReport({ id: 2, role: "USER" }, { visibility: "ANONYMOUS", authorId: 1 })).toBe(true);
  });
});

describe("canCreateReport", () => {
  it("mahasiswa, dosen (USER), dan moderator boleh membuat laporan; admin tidak", () => {
    expect(canCreateReport("USER")).toBe(true);
    expect(canCreateReport("MODERATOR")).toBe(true);
    expect(canCreateReport("ADMIN")).toBe(false);
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

  it("pengguna lain dan moderator bukan pelapor tidak menerima alasan penolakan maupun riwayat", () => {
    for (const role of ["USER", "MODERATOR"] as const) {
      const other = toReportDetail(detailRow, { id: 2, role });
      expect(other.rejectionReason).toBeNull();
      expect(other.history).toEqual([]);
    }
  });

  it("detail laporan Anonymous tidak membocorkan nama pelapor", () => {
    const anon = { ...detailRow, visibility: "ANONYMOUS" as const };
    expect(JSON.stringify(toReportDetail(anon, { id: 2, role: "USER" }))).not.toContain("Gilang");
    expect(JSON.stringify(toReportDetail(anon, { id: 1, role: "USER" }))).not.toContain("Gilang");
  });

  const adminRow = {
    ...row,
    rejectionReason: null,
    createdAt: new Date("2026-10-11T03:00:00.000Z"),
    author: { name: "Muhamad Gilang", username: "2113231092", userType: "MAHASISWA" as const },
  };

  it("admin melihat identitas pelapor, termasuk laporan Anonymous", () => {
    const item = toAdminReportItem({ ...adminRow, visibility: "ANONYMOUS" }, 9);
    expect(item.authorName).toBe("Muhamad Gilang");
    expect(item.authorUsername).toBe("2113231092");
    expect(item.visibility).toBe("ANONYMOUS");
  });

  it("laporan dari dosen ditandai fromLecturer", () => {
    const dosen = { ...adminRow, author: { ...adminRow.author, userType: "DOSEN" as const } };
    expect(toAdminReportItem(dosen, 9).fromLecturer).toBe(true);
    expect(toAdminReportItem(adminRow, 9).fromLecturer).toBe(false);
    expect(
      toAdminReportItem({ ...adminRow, author: { ...adminRow.author, userType: null } }, 9).fromLecturer,
    ).toBe(false);
  });

  it("laporan dosen yang Anonymous tetap ditandai bagi admin", () => {
    const dosenAnon = {
      ...adminRow,
      visibility: "ANONYMOUS" as const,
      author: { ...adminRow.author, userType: "DOSEN" as const },
    };
    expect(toAdminReportItem(dosenAnon, 9).fromLecturer).toBe(true);
  });
});

describe("dukungan laporan", () => {
  const ok = { isOwn: false, visibility: "PUBLIC" as const, status: "UNVERIFIED" as const };

  it("mahasiswa, dosen, dan moderator boleh mendukung laporan orang lain yang Public", () => {
    expect(supportBlockReason("USER", ok)).toBeNull();
    expect(supportBlockReason("MODERATOR", ok)).toBeNull();
  });

  it("laporan Anonymous dan yang sudah terverifikasi tetap dapat didukung", () => {
    expect(supportBlockReason("USER", { ...ok, visibility: "ANONYMOUS" })).toBeNull();
    expect(supportBlockReason("USER", { ...ok, status: "VERIFIED" })).toBeNull();
  });

  it("admin tidak boleh mendukung", () => {
    expect(supportBlockReason("ADMIN", ok)).not.toBeNull();
  });

  it("tidak boleh mendukung laporan sendiri", () => {
    expect(supportBlockReason("USER", { ...ok, isOwn: true })).not.toBeNull();
  });

  it("tidak boleh mendukung laporan Private atau yang ditolak", () => {
    expect(supportBlockReason("USER", { ...ok, visibility: "PRIVATE" })).not.toBeNull();
    expect(supportBlockReason("USER", { ...ok, status: "REJECTED" })).not.toBeNull();
  });

  it("jumlah dukungan dan status dukungan pengguna dibaca dari baris database", () => {
    const item = toReportItem({ ...row, _count: { supports: 5 }, supports: [{ userId: 2 }] }, 2);
    expect(item.supportCount).toBe(5);
    expect(item.supportedByMe).toBe(true);

    const none = toReportItem({ ...row, _count: { supports: 0 }, supports: [] }, 2);
    expect(none.supportCount).toBe(0);
    expect(none.supportedByMe).toBe(false);
  });

  it("tanpa data dukungan, nilainya 0 dan belum didukung", () => {
    const item = toReportItem(row, 2);
    expect(item.supportCount).toBe(0);
    expect(item.supportedByMe).toBe(false);
  });

  it("validasi input dukungan", () => {
    expect(supportReportSchema.safeParse({ reportId: 3 }).success).toBe(true);
    expect(supportReportSchema.safeParse({ reportId: 0 }).success).toBe(false);
    expect(supportReportSchema.safeParse({ reportId: "3" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  allowedVisibilities,
  canChangeStatus,
  canViewReport,
  editBlockReason,
  canCreateReport,
  requiresNote,
  supportBlockReason,
  toAdminReportItem,
  toReportDetail,
  toReportItem,
  type ReportRow,
} from "../src/modules/report/rules";
import { generateReportSlug, isNumericId, randomSuffix, slugify } from "../src/modules/report/slug";
import {
  createReportInputSchema,
  reportPhotoSchema,
  supportReportSchema,
  updateReportInputSchema,
  updateReportStatusSchema,
} from "../src/modules/report/schemas";

const row: ReportRow = {
  id: 7,
  slug: "lampu-koridor-mati-ab12cd",
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
    expect(canChangeStatus("IN_PROGRESS", "IN_PROGRESS")).toBe(false);
  });

  it("alur utama: Belum Terverifikasi, Terverifikasi, Diproses, Selesai", () => {
    expect(canChangeStatus("UNVERIFIED", "VERIFIED")).toBe(true);
    expect(canChangeStatus("VERIFIED", "IN_PROGRESS")).toBe(true);
    expect(canChangeStatus("IN_PROGRESS", "RESOLVED")).toBe(true);
  });

  it("tidak boleh melompati verifikasi", () => {
    expect(canChangeStatus("UNVERIFIED", "IN_PROGRESS")).toBe(false);
    expect(canChangeStatus("UNVERIFIED", "RESOLVED")).toBe(false);
  });

  it("jalur koreksi bagi admin", () => {
    expect(canChangeStatus("IN_PROGRESS", "VERIFIED")).toBe(true); // membatalkan Diproses
    expect(canChangeStatus("RESOLVED", "IN_PROGRESS")).toBe(true); // membuka kembali
    expect(canChangeStatus("REJECTED", "UNVERIFIED")).toBe(true); // meninjau ulang
    expect(canChangeStatus("VERIFIED", "RESOLVED")).toBe(true); // selesai tanpa fase diproses
  });

  it("laporan yang ditolak tidak bisa langsung diproses atau diselesaikan", () => {
    expect(canChangeStatus("REJECTED", "VERIFIED")).toBe(false);
    expect(canChangeStatus("REJECTED", "IN_PROGRESS")).toBe(false);
    expect(canChangeStatus("REJECTED", "RESOLVED")).toBe(false);
  });

  it("allowedNextStatuses tidak memuat status saat ini dan konsisten dengan canChangeStatus", () => {
    const all = ["UNVERIFIED", "VERIFIED", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;
    for (const from of all) {
      const next = allowedNextStatuses(from);
      expect(next).not.toContain(from);
      for (const to of all) expect(next.includes(to)).toBe(canChangeStatus(from, to));
    }
  });

  it("laporan yang selesai tidak dapat didukung lagi, tetapi yang diproses masih bisa", () => {
    const ok = { isOwn: false, visibility: "PUBLIC" as const };
    expect(supportBlockReason("USER", { ...ok, status: "RESOLVED" })).not.toBeNull();
    expect(supportBlockReason("USER", { ...ok, status: "IN_PROGRESS" })).toBeNull();
    expect(supportBlockReason("USER", { ...ok, status: "VERIFIED" })).toBeNull();
  });

  it("laporan yang diproses atau selesai dikunci dari edit", () => {
    for (const status of ["VERIFIED", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const) {
      expect(editBlockReason("USER", { isOwn: true, status })).not.toBeNull();
    }
  });

  it("status baru diterima oleh validasi ubah status", () => {
    for (const status of ["IN_PROGRESS", "RESOLVED"]) {
      expect(updateReportStatusSchema.safeParse({ reportId: 1, status }).success).toBe(true);
    }
    expect(updateReportStatusSchema.safeParse({ reportId: 1, status: "ARCHIVED" }).success).toBe(false);
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
    author: {
      name: "Muhamad Gilang",
      username: "2113231092",
      userType: "MAHASISWA" as const,
      role: "USER" as const,
    },
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

describe("edit laporan", () => {
  const own = { isOwn: true, status: "UNVERIFIED" as const };

  it("pelapor hanya boleh mengubah laporan yang masih Belum Terverifikasi", () => {
    expect(editBlockReason("USER", own)).toBeNull();
    expect(editBlockReason("MODERATOR", own)).toBeNull();
  });

  it("laporan yang terverifikasi atau ditolak dikunci", () => {
    expect(editBlockReason("USER", { ...own, status: "VERIFIED" })).not.toBeNull();
    expect(editBlockReason("USER", { ...own, status: "REJECTED" })).not.toBeNull();
    expect(editBlockReason("MODERATOR", { ...own, status: "REJECTED" })).not.toBeNull();
  });

  it("hanya pelapor yang boleh mengubah, admin tidak", () => {
    expect(editBlockReason("USER", { ...own, isOwn: false })).not.toBeNull();
    expect(editBlockReason("MODERATOR", { ...own, isOwn: false })).not.toBeNull();
    expect(editBlockReason("ADMIN", own)).not.toBeNull();
  });

  describe("updateReportInputSchema", () => {
    const base = {
      reportId: 4,
      title: "Lampu koridor mati",
      description: "Lampu di koridor lantai 2 mati sejak kemarin",
      location: "Gedung A",
      category: "FASILITAS",
      occurredAt: "2026-10-11",
      visibility: "PUBLIC",
    };

    it("foto boleh tidak dikirim (tetap), null (hapus), atau objek (ganti)", () => {
      const parsedKeep = updateReportInputSchema.safeParse(base);
      expect(parsedKeep.success).toBe(true);
      expect(parsedKeep.success && "photo" in parsedKeep.data && parsedKeep.data.photo).toBeFalsy();
      expect("photo" in (parsedKeep.success ? parsedKeep.data : {})).toBe(false);

      const parsedRemove = updateReportInputSchema.safeParse({ ...base, photo: null });
      expect(parsedRemove.success && parsedRemove.data.photo).toBeNull();
    });

    it("menolak reportId yang tidak valid dan data yang melanggar aturan laporan", () => {
      expect(updateReportInputSchema.safeParse({ ...base, reportId: 0 }).success).toBe(false);
      expect(updateReportInputSchema.safeParse({ ...base, title: "abc" }).success).toBe(false);
    });
  });
});

describe("slug laporan", () => {
  it("mengubah judul menjadi bentuk URL", () => {
    expect(slugify("WiFi Busuk!!")).toBe("wifi-busuk");
    expect(slugify("  Lampu   Koridor -- Lantai 2  ")).toBe("lampu-koridor-lantai-2");
  });

  it("menghilangkan aksen dan simbol", () => {
    expect(slugify("Café Kampus: Éclair & Kopi")).toBe("cafe-kampus-eclair-kopi");
  });

  it("memakai 'laporan' bila judul tidak punya huruf atau angka", () => {
    expect(slugify("!!!")).toBe("laporan");
    expect(slugify("")).toBe("laporan");
  });

  it("membatasi panjang dan tidak berakhir dengan tanda hubung", () => {
    const slug = slugify("kata ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("akhiran acak berisi huruf kecil dan angka sesuai byte yang diberikan", () => {
    // indeks 0->a, 1->b, 25->z, 26->0, 35->9, 36 (36 % 36 = 0)->a
    expect(randomSuffix(6, new Uint8Array([0, 1, 25, 26, 35, 36]))).toBe("abz09a");
    expect(randomSuffix()).toMatch(/^[a-z0-9]{6}$/);
  });

  it("slug lengkap memenuhi pola URL dan tidak berupa angka murni", () => {
    const slug = generateReportSlug("WiFi Busuk!!", "k3x9ab");
    expect(slug).toBe("wifi-busuk-k3x9ab");
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(isNumericId(slug)).toBe(false);
    expect(generateReportSlug("12345", "ab12cd")).toBe("12345-ab12cd");
    expect(isNumericId(generateReportSlug("12345", "ab12cd"))).toBe(false);
  });

  it("slug acak berbeda pada pemanggilan berikutnya", () => {
    const a = generateReportSlug("Judul sama");
    const b = generateReportSlug("Judul sama");
    expect(a).not.toBe(b);
  });

  it("mengenali alamat lama berbentuk nomor", () => {
    expect(isNumericId("4")).toBe(true);
    expect(isNumericId("004")).toBe(true);
    expect(isNumericId("4a")).toBe(false);
    expect(isNumericId("wifi-busuk-k3x9ab")).toBe(false);
  });

  it("toReportItem menyertakan slug", () => {
    expect(toReportItem(row, 1).slug).toBe("lampu-koridor-mati-ab12cd");
  });
});

describe("laporan moderator", () => {
  it("moderator hanya boleh memilih visibilitas Public", () => {
    expect(allowedVisibilities("MODERATOR")).toEqual(["PUBLIC"]);
  });

  it("mahasiswa dan dosen boleh memilih ketiga visibilitas", () => {
    expect(allowedVisibilities("USER")).toEqual(["PUBLIC", "ANONYMOUS", "PRIVATE"]);
  });

  it("laporan dari moderator ditandai fromModerator bagi admin", () => {
    const base = {
      ...row,
      rejectionReason: null,
      createdAt: new Date("2026-10-11T03:00:00.000Z"),
      author: { name: "Moderator", username: "moderator", userType: null, role: "MODERATOR" as const },
    };
    const item = toAdminReportItem(base, 9);
    expect(item.fromModerator).toBe(true);
    expect(item.fromLecturer).toBe(false);
  });

  it("laporan dari mahasiswa dan dosen tidak ditandai fromModerator", () => {
    const base = {
      ...row,
      rejectionReason: null,
      createdAt: new Date("2026-10-11T03:00:00.000Z"),
      author: { name: "Dosen", username: "0411058501", userType: "DOSEN" as const, role: "USER" as const },
    };
    const item = toAdminReportItem(base, 9);
    expect(item.fromModerator).toBe(false);
    expect(item.fromLecturer).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { MAX_PRICE } from "../src/modules/marketplace/constants";
import { parseDigits } from "../src/modules/marketplace/format";
import { validateListingForm, type ListingFormValues } from "../src/modules/marketplace/form-validation";
import {
  computeSellerStats,
  priceToNumber,
  toListingDetail,
  toListingSummary,
  toSellerListing,
  type ListingRow,
} from "../src/modules/marketplace/mappers";
import {
  canUseMarketplace,
  canViewListing,
  isPubliclyListed,
  listingCreateBlockReason,
  listingManageBlockReason,
} from "../src/modules/marketplace/rules";
import {
  createListingInputSchema,
  deleteListingSchema,
  listingPhotoSchema,
  setListingActiveSchema,
  updateListingInputSchema,
} from "../src/modules/marketplace/schemas";
import {
  RESERVED_LISTING_SLUGS,
  generateListingSlug,
  isReservedListingSlug,
  isValidListingSlug,
} from "../src/modules/marketplace/slug";
import { slugify } from "../src/modules/report/slug";

const uuid = "123e4567-e89b-12d3-a456-426614174000";
const publicId = `concordia/marketplace/${uuid}`;
const photo = {
  url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`,
  publicId,
  format: "jpg" as const,
  bytes: 120_000,
};

const valid = {
  title: "iPhone 12 Pro Max",
  price: 8_500_000,
  category: "ELECTRONICS",
  condition: "USED",
  availability: "AVAILABLE",
  description: "Mulus, baterai 90 persen, lengkap dengan kotak.",
  location: "Kampus Bandung",
  allowCod: true,
  allowShipping: false,
  photo,
};

const fieldsOf = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  new Set(r.error?.issues.map((i) => String(i.path[0])) ?? []);

describe("slug tawaran", () => {
  it("membentuk slug dari judul dengan akhiran acak", () => {
    expect(generateListingSlug("iPhone 12 Pro Max!", "k3x9ab")).toBe("iphone-12-pro-max-k3x9ab");
  });

  it("memakai kata cadangan 'tawaran' (bukan 'laporan') bila judul tanpa huruf atau angka", () => {
    expect(generateListingSlug("!!!", "k3x9ab")).toBe("tawaran-k3x9ab");
    expect(slugify("!!!")).toBe("laporan"); // perilaku modul laporan tidak berubah
  });

  it("slug yang dihasilkan selalu valid dan tidak pernah sama dengan segmen yang dicadangkan", () => {
    for (const word of RESERVED_LISTING_SLUGS) {
      const slug = generateListingSlug(word);
      expect(isValidListingSlug(slug)).toBe(true);
      expect(isReservedListingSlug(slug)).toBe(false);
    }
  });

  it("slug yang dihasilkan tidak berupa angka murni", () => {
    expect(generateListingSlug("12345", "ab12cd")).toBe("12345-ab12cd");
    expect(/^\d+$/.test(generateListingSlug("12345"))).toBe(false);
  });

  it("slug acak berbeda pada pemanggilan berikutnya", () => {
    expect(generateListingSlug("Judul sama")).not.toBe(generateListingSlug("Judul sama"));
  });

  it("menolak slug dari alamat yang tidak sah", () => {
    for (const bad of ["baru", "beli", "jual", "pesan", "Huruf-Besar", "dua--tanda", "-awal", "akhir-", "a b", "", "x".repeat(81)]) {
      expect(isValidListingSlug(bad), bad).toBe(false);
    }
    expect(isValidListingSlug("iphone-12-k3x9ab")).toBe(true);
  });
});

describe("skema membuat tawaran", () => {
  it("menerima data yang valid", () => {
    expect(createListingInputSchema.safeParse(valid).success).toBe(true);
  });

  it("menerima harga di atas batas Int 32-bit hingga batas aplikasi", () => {
    expect(createListingInputSchema.safeParse({ ...valid, price: 9_200_000_000 }).success).toBe(true);
    expect(createListingInputSchema.safeParse({ ...valid, price: MAX_PRICE }).success).toBe(true);
  });

  it("menolak harga di luar batas, pecahan, dan bukan angka", () => {
    for (const price of [0, -1, MAX_PRICE + 1, 10.5, NaN, "1000", null]) {
      expect(createListingInputSchema.safeParse({ ...valid, price }).success, String(price)).toBe(false);
    }
  });

  it("batas panjang judul, keterangan, dan lokasi", () => {
    const check = (patch: object) => createListingInputSchema.safeParse({ ...valid, ...patch }).success;
    expect(check({ title: "ab" })).toBe(false);
    expect(check({ title: "abc" })).toBe(true);
    expect(check({ title: "a".repeat(100) })).toBe(true);
    expect(check({ title: "a".repeat(101) })).toBe(false);
    expect(check({ description: "a".repeat(9) })).toBe(false);
    expect(check({ description: "a".repeat(10) })).toBe(true);
    expect(check({ description: "a".repeat(2000) })).toBe(true);
    expect(check({ description: "a".repeat(2001) })).toBe(false);
    expect(check({ description: "         a         " })).toBe(false); // pendek setelah dipangkas
    expect(check({ location: "k" })).toBe(false);
    expect(check({ location: "kb" })).toBe(true);
    expect(check({ location: "k".repeat(121) })).toBe(false);
  });

  it("memangkas spasi di awal dan akhir teks", () => {
    const r = createListingInputSchema.safeParse({ ...valid, title: "  Buku Kalkulus  " });
    expect(r.success && r.data.title).toBe("Buku Kalkulus");
  });

  it("menolak nilai di luar enum", () => {
    for (const patch of [{ category: "MOBIL" }, { condition: "RUSAK" }, { availability: "HABIS" }]) {
      expect(createListingInputSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });

  it("minimal satu preferensi penjualan, kesalahan dilaporkan pada 'preference'", () => {
    const r = createListingInputSchema.safeParse({ ...valid, allowCod: false, allowShipping: false });
    expect(r.success).toBe(false);
    expect(fieldsOf(r)).toEqual(new Set(["preference"]));
    expect(createListingInputSchema.safeParse({ ...valid, allowCod: false, allowShipping: true }).success).toBe(true);
  });

  it("cover image wajib saat membuat", () => {
    const { photo: _omit, ...withoutPhoto } = valid;
    void _omit;
    expect(createListingInputSchema.safeParse(withoutPhoto).success).toBe(false);
    expect(createListingInputSchema.safeParse({ ...valid, photo: null }).success).toBe(false);
  });
});

describe("validasi foto tawaran", () => {
  it("menerima metadata hasil unggah yang sah", () => {
    expect(listingPhotoSchema.safeParse(photo).success).toBe(true);
  });

  it("menolak host selain Cloudinary", () => {
    expect(listingPhotoSchema.safeParse({ ...photo, url: `https://evil.example/${publicId}.jpg` }).success).toBe(false);
  });

  it("menolak publicId dari folder lain, termasuk folder laporan", () => {
    for (const folder of ["reports", "avatars", "forum"]) {
      const other = `concordia/${folder}/${uuid}`;
      const r = listingPhotoSchema.safeParse({ ...photo, publicId: other, url: `https://res.cloudinary.com/demo/${other}.jpg` });
      expect(r.success, folder).toBe(false);
    }
  });

  it("menolak URL yang tidak memuat publicId", () => {
    expect(listingPhotoSchema.safeParse({ ...photo, url: "https://res.cloudinary.com/demo/lain.jpg" }).success).toBe(false);
  });

  it("menolak ukuran lebih dari 4 MB dan format di luar JPG, PNG, WebP", () => {
    expect(listingPhotoSchema.safeParse({ ...photo, bytes: 4 * 1024 * 1024 + 1 }).success).toBe(false);
    expect(listingPhotoSchema.safeParse({ ...photo, bytes: 4 * 1024 * 1024 }).success).toBe(true);
    expect(listingPhotoSchema.safeParse({ ...photo, format: "gif" }).success).toBe(false);
  });
});

describe("skema ubah, nonaktifkan, dan hapus", () => {
  const base = { ...valid, listingId: 5 };

  it("foto boleh tidak dikirim (tetap) atau berupa objek (ganti), tetapi tidak boleh null", () => {
    const { photo: _omit, ...withoutPhoto } = base;
    void _omit;
    expect(updateListingInputSchema.safeParse(withoutPhoto).success).toBe(true);
    expect(updateListingInputSchema.safeParse(base).success).toBe(true);
    expect(updateListingInputSchema.safeParse({ ...base, photo: null }).success).toBe(false);
  });

  it("listingId wajib bilangan bulat positif", () => {
    for (const listingId of [0, -1, 1.5, "5", undefined]) {
      expect(updateListingInputSchema.safeParse({ ...base, listingId }).success, String(listingId)).toBe(false);
    }
  });

  it("aturan isian sama dengan saat membuat", () => {
    expect(updateListingInputSchema.safeParse({ ...base, price: MAX_PRICE + 1 }).success).toBe(false);
    expect(updateListingInputSchema.safeParse({ ...base, allowCod: false, allowShipping: false }).success).toBe(false);
  });

  it("skema nonaktifkan dan hapus", () => {
    expect(setListingActiveSchema.safeParse({ listingId: 1, isActive: false }).success).toBe(true);
    expect(setListingActiveSchema.safeParse({ listingId: 1, isActive: "false" }).success).toBe(false);
    expect(setListingActiveSchema.safeParse({ listingId: 1 }).success).toBe(false);
    expect(deleteListingSchema.safeParse({ listingId: 1 }).success).toBe(true);
    expect(deleteListingSchema.safeParse({ listingId: 0 }).success).toBe(false);
  });
});

describe("kesesuaian validasi server dengan form (klien)", () => {
  const formValid: ListingFormValues = {
    title: "iPhone 12 Pro Max",
    price: "8.500.000",
    category: "ELECTRONICS",
    condition: "USED",
    availability: "AVAILABLE",
    description: "Mulus, baterai 90 persen, lengkap dengan kotak.",
    location: "Kampus Bandung",
    allowCod: true,
    allowShipping: false,
  };

  const cases: [string, Partial<ListingFormValues>][] = [
    ["data valid", {}],
    ["judul 2 karakter", { title: "ab" }],
    ["judul 101 karakter", { title: "a".repeat(101) }],
    ["judul hanya spasi", { title: "     " }],
    ["harga kosong", { price: "" }],
    ["harga nol", { price: "0" }],
    ["harga melebihi batas", { price: String(MAX_PRICE + 1) }],
    ["harga tepat di batas", { price: String(MAX_PRICE) }],
    ["kategori kosong", { category: "" }],
    ["kondisi kosong", { condition: "" }],
    ["ketersediaan kosong", { availability: "" }],
    ["keterangan 9 karakter", { description: "a".repeat(9) }],
    ["keterangan 2001 karakter", { description: "a".repeat(2001) }],
    ["keterangan hanya spasi", { description: " ".repeat(20) }],
    ["lokasi 1 karakter", { location: "k" }],
    ["tanpa preferensi penjualan", { allowCod: false, allowShipping: false }],
    ["hanya ekspedisi", { allowCod: false, allowShipping: true }],
  ];

  it.each(cases)("klien dan server sepakat: %s", (_label, patch) => {
    const values = { ...formValid, ...patch };
    const clientErrors = Object.keys(validateListingForm(values, { type: "image/jpeg", size: 1000 }, { requirePhoto: true }));

    const input = {
      title: values.title,
      price: parseDigits(values.price) ?? NaN,
      category: values.category || undefined,
      condition: values.condition || undefined,
      availability: values.availability || undefined,
      description: values.description,
      location: values.location,
      allowCod: values.allowCod,
      allowShipping: values.allowShipping,
      photo,
    };
    const server = createListingInputSchema.safeParse(input);

    expect(server.success).toBe(clientErrors.length === 0);
    expect(fieldsOf(server)).toEqual(new Set(clientErrors));
  });
});

describe("aturan akses Marketplace", () => {
  const seller = { id: 7, role: "USER" as const };
  const listing = { sellerId: 7, isActive: true };

  it("admin tidak memakai Marketplace; mahasiswa, dosen, dan moderator boleh", () => {
    expect(canUseMarketplace("USER")).toBe(true);
    expect(canUseMarketplace("MODERATOR")).toBe(true);
    expect(canUseMarketplace("ADMIN")).toBe(false);
    expect(listingCreateBlockReason("USER")).toBeNull();
    expect(listingCreateBlockReason("MODERATOR")).toBeNull();
    expect(listingCreateBlockReason("ADMIN")).not.toBeNull();
  });

  it("hanya penjual yang boleh mengelola tawarannya", () => {
    expect(listingManageBlockReason(seller, listing)).toBeNull();
    expect(listingManageBlockReason({ id: 7, role: "MODERATOR" }, listing)).toBeNull();
    expect(listingManageBlockReason({ id: 8, role: "USER" }, listing)).not.toBeNull();
    expect(listingManageBlockReason({ id: 8, role: "MODERATOR" }, listing)).not.toBeNull();
  });

  it("admin tidak boleh mengelola tawaran, bahkan bila id-nya sama dengan penjual", () => {
    expect(listingManageBlockReason({ id: 7, role: "ADMIN" }, listing)).not.toBeNull();
  });

  it("tawaran aktif terlihat semua pengguna Marketplace", () => {
    expect(canViewListing({ id: 8, role: "USER" }, listing)).toBe(true);
    expect(canViewListing({ id: 9, role: "MODERATOR" }, listing)).toBe(true);
  });

  it("tawaran nonaktif hanya terlihat penjualnya", () => {
    const inactive = { sellerId: 7, isActive: false };
    expect(canViewListing(seller, inactive)).toBe(true);
    expect(canViewListing({ id: 8, role: "USER" }, inactive)).toBe(false);
    expect(canViewListing({ id: 9, role: "MODERATOR" }, inactive)).toBe(false);
  });

  it("admin tidak dapat membuka halaman tawaran", () => {
    expect(canViewListing({ id: 1, role: "ADMIN" }, listing)).toBe(false);
  });

  it("hanya tawaran aktif yang tampil di daftar umum", () => {
    expect(isPubliclyListed({ isActive: true })).toBe(true);
    expect(isPubliclyListed({ isActive: false })).toBe(false);
  });
});

describe("pemetaan data database ke komponen", () => {
  const row: ListingRow = {
    id: 3,
    slug: "helikopter-second-k3x9ab",
    title: "Helikopter second",
    description: "Helikopter 2019, perawatan rutin.",
    price: 9_200_000_000n,
    category: "VEHICLES",
    condition: "USED",
    availability: "LIMITED",
    location: "Bandung",
    allowCod: false,
    allowShipping: true,
    isActive: true,
    createdAt: new Date("2026-11-10T08:00:00.000Z"),
    seller: { name: "Erlangga Yuda Pratama", jurusan: "Teknik Informatika" },
    photos: [{ url: "https://res.cloudinary.com/demo/a.jpg" }, { url: "https://res.cloudinary.com/demo/b.jpg" }],
  };

  it("mengubah harga bigint menjadi number tanpa kehilangan nilai", () => {
    expect(priceToNumber(9_200_000_000n)).toBe(9_200_000_000);
    expect(priceToNumber(BigInt(MAX_PRICE))).toBe(MAX_PRICE);
    expect(priceToNumber(1500)).toBe(1500);
  });

  it("menolak harga di luar rentang aman", () => {
    expect(() => priceToNumber(BigInt(Number.MAX_SAFE_INTEGER) + 10n)).toThrow(RangeError);
  });

  it("ringkasan memakai foto pertama sebagai cover", () => {
    const s = toListingSummary(row);
    expect(s.price).toBe(9_200_000_000);
    expect(s.photoUrl).toBe("https://res.cloudinary.com/demo/a.jpg");
    expect(toListingSummary({ ...row, photos: [] }).photoUrl).toBeNull();
  });

  it("detail memuat info penjual, preferensi, tanggal ISO, dan rincian dasar", () => {
    const d = toListingDetail(row);
    expect(d.seller).toEqual({ name: "Erlangga Yuda Pratama", major: "Teknik Informatika" });
    expect(d.allowCod).toBe(false);
    expect(d.allowShipping).toBe(true);
    expect(d.postedAt).toBe("2026-11-10T08:00:00.000Z");
    expect(d.specs).toEqual([]);
    expect(d.details.map((x) => x.label)).toEqual(["Kondisi", "Kategori", "Ketersediaan"]);
    expect(d.details[0].value).toBe("Bekas");
  });

  it("jurusan kosong menjadi teks kosong", () => {
    expect(toListingDetail({ ...row, seller: { name: "X", jurusan: null } }).seller.major).toBe("");
  });

  it("data yang dikirim ke browser tidak memuat identitas penjual selain nama dan jurusan", () => {
    const json = JSON.stringify(toListingDetail({ ...row, sellerId: 99, seller: { ...row.seller, passwordHash: "rahasia", username: "u1" } } as never));
    for (const secret of ["sellerId", "passwordHash", "rahasia", "username", "99"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("hasil pemetaan dapat diserialisasi ke JSON (tanpa bigint)", () => {
    expect(() => JSON.stringify(toListingDetail(row))).not.toThrow();
    expect(() => JSON.stringify(toSellerListing(row))).not.toThrow();
  });

  it("Menu Jual: status aktif dan jumlah dilihat", () => {
    expect(toSellerListing(row).active).toBe(true);
    expect(toSellerListing({ ...row, isActive: false }, 12)).toMatchObject({ active: false, views: 12 });
  });

  it("statistik penjual: tiap tawaran masuk tepat satu kelompok", () => {
    const rows = [
      { availability: "AVAILABLE", isActive: true },
      { availability: "LIMITED", isActive: true },
      { availability: "AVAILABLE", isActive: false },
      { availability: "SOLD", isActive: true },
      { availability: "SOLD", isActive: false },
    ] as const;
    const stats = computeSellerStats([...rows]);
    expect(stats).toMatchObject({ activeCount: 2, soldCount: 2, inactiveCount: 1, totalSales: 2 });
    expect(stats.activeCount + stats.soldCount + stats.inactiveCount).toBe(rows.length);
    expect(computeSellerStats([])).toMatchObject({ activeCount: 0, soldCount: 0, inactiveCount: 0 });
  });
});

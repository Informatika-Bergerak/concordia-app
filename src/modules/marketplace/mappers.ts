import { AVAILABILITY_LABELS, CATEGORY_LABELS, CONDITION_LABELS } from "./constants";
import type { SellerListing, SellerStats } from "./seller-types";
import type {
  ListingAvailability,
  ListingCategory,
  ListingCondition,
  ListingDetail,
  ListingSummary,
} from "./types";

// Mengubah baris database menjadi bentuk data yang dipakai komponen. Fungsi murni.
// Data pribadi penjual (selain nama dan jurusan) sengaja tidak ikut terbawa ke browser.

/** Baris `Listing` beserta relasi yang dibutuhkan. `price` bertipe bigint dari database. */
export type ListingRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: bigint | number;
  category: ListingCategory;
  condition: ListingCondition;
  availability: ListingAvailability;
  location: string;
  allowCod: boolean;
  allowShipping: boolean;
  isActive: boolean;
  createdAt: Date;
  seller: { name: string; jurusan: string | null };
  photos: { url: string }[];
};

/** bigint -> number. Aman karena batas harga (100 miliar) jauh di bawah 2^53. */
export function priceToNumber(price: bigint | number): number {
  const value = typeof price === "bigint" ? Number(price) : price;
  if (!Number.isSafeInteger(value)) throw new RangeError("Harga di luar rentang yang aman");
  return value;
}

export function toListingSummary(row: ListingRow): ListingSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: priceToNumber(row.price),
    location: row.location,
    photoUrl: row.photos[0]?.url ?? null,
    category: row.category,
    condition: row.condition,
    availability: row.availability,
  };
}

export function toListingDetail(row: ListingRow): ListingDetail {
  return {
    ...toListingSummary(row),
    description: row.description,
    // Spesifikasi rinci belum disimpan di database; rincian dasar diturunkan dari kolom yang ada.
    specs: [],
    details: [
      { label: "Kondisi", value: CONDITION_LABELS[row.condition] },
      { label: "Kategori", value: CATEGORY_LABELS[row.category] },
      { label: "Ketersediaan", value: AVAILABILITY_LABELS[row.availability] },
    ],
    seller: { name: row.seller.name, major: row.seller.jurusan ?? "" },
    allowCod: row.allowCod,
    allowShipping: row.allowShipping,
    postedAt: row.createdAt.toISOString(),
  };
}

/** Untuk Menu Jual. Jumlah dilihat belum dicatat di database, jadi bernilai 0 sampai fitur Insight ada. */
export function toSellerListing(row: ListingRow, views = 0): SellerListing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: priceToNumber(row.price),
    photoUrl: row.photos[0]?.url ?? null,
    availability: row.availability,
    postedAt: row.createdAt.toISOString(),
    views,
    active: row.isActive,
  };
}

/**
 * Ringkasan Dashbor Penjual. Setiap tawaran masuk tepat satu kelompok:
 * terjual (availability SOLD), aktif (dipublikasikan dan belum terjual), atau nonaktif.
 * Obrolan dan penjualan belum punya data, jadi `pendingChats` dan `needsAttention` bernilai 0.
 */
export function computeSellerStats(rows: { availability: ListingAvailability; isActive: boolean }[]): SellerStats {
  const soldCount = rows.filter((r) => r.availability === "SOLD").length;
  const activeCount = rows.filter((r) => r.availability !== "SOLD" && r.isActive).length;
  const inactiveCount = rows.length - soldCount - activeCount;
  return { pendingChats: 0, totalSales: soldCount, needsAttention: 0, activeCount, soldCount, inactiveCount };
}

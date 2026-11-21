// Slug untuk alamat tawaran, mis. "iphone-12-pro-max-k3x9ab". Fungsi murni agar mudah diuji.
// Memakai relatif import (bukan "@/") supaya dapat diuji tanpa konfigurasi alias.

import { randomSuffix, slugify } from "../report/slug";

/**
 * Segmen statis di bawah /marketplace. Next.js mendahulukan segmen statis daripada [slug],
 * jadi slug tawaran tidak boleh sama dengan salah satunya.
 */
export const RESERVED_LISTING_SLUGS = ["baru", "beli", "jual", "pesan"] as const;

export const LISTING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;
const FALLBACK_BASE = "tawaran";

export function isReservedListingSlug(value: string): boolean {
  return (RESERVED_LISTING_SLUGS as readonly string[]).includes(value);
}

/**
 * Slug tawaran: judul yang dinormalkan + akhiran acak 6 karakter. Selalu memuat tanda hubung
 * dan akhiran, sehingga tidak pernah sama dengan kata yang dicadangkan atau berupa angka murni.
 * Keunikan dijaga indeks unik di database.
 */
export function generateListingSlug(title: string, suffix: string = randomSuffix()): string {
  return `${slugify(title, 50, FALLBACK_BASE)}-${suffix}`;
}

/** Pemeriksaan bentuk slug dari alamat (parameter rute), sebelum dicari di database. */
export function isValidListingSlug(value: string): boolean {
  return (
    value.length <= MAX_SLUG_LENGTH && LISTING_SLUG_PATTERN.test(value) && !isReservedListingSlug(value)
  );
}

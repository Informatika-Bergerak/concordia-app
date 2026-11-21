import type { ViewerRole } from "../report/rules";

// Aturan murni (tanpa akses database) untuk Marketplace, supaya mudah diuji.

/** Marketplace dipakai mahasiswa, dosen, dan moderator; admin tidak ikut berjual beli. */
export function canUseMarketplace(role: ViewerRole): boolean {
  return role !== "ADMIN";
}

export function listingCreateBlockReason(role: ViewerRole): string | null {
  return canUseMarketplace(role) ? null : "Admin tidak membuat tawaran";
}

/** Alasan pengguna tidak boleh mengubah, menonaktifkan, atau menghapus tawaran ini; null bila boleh. */
export function listingManageBlockReason(
  viewer: { id: number; role: ViewerRole },
  listing: { sellerId: number },
): string | null {
  if (!canUseMarketplace(viewer.role)) return "Admin tidak mengelola tawaran";
  if (listing.sellerId !== viewer.id) return "Hanya penjual yang dapat mengelola tawaran ini";
  return null;
}

/** Tawaran yang dinonaktifkan hanya dapat dibuka penjualnya; yang aktif dapat dibuka semua pengguna Marketplace. */
export function canViewListing(
  viewer: { id: number; role: ViewerRole },
  listing: { sellerId: number; isActive: boolean },
): boolean {
  if (!canUseMarketplace(viewer.role)) return false;
  return listing.isActive || listing.sellerId === viewer.id;
}

/** Tampil di daftar umum (grid beranda Marketplace). */
export function isPubliclyListed(listing: { isActive: boolean }): boolean {
  return listing.isActive;
}

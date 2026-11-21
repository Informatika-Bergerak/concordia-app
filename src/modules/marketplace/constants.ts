import type { ListingAvailability, ListingCategory, ListingCondition } from "./types";

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  BOOKS: "Buku & Alat Kuliah",
  ELECTRONICS: "Elektronik",
  FASHION: "Fashion",
  VEHICLES: "Kendaraan",
  BOARDING_HOUSE: "Kos & Hunian",
  SERVICES: "Jasa",
  FOOD: "Makanan & Minuman",
  OTHER: "Lainnya",
};

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: "Baru",
  USED: "Bekas",
};

export const AVAILABILITY_LABELS: Record<ListingAvailability, string> = {
  AVAILABLE: "Stok Tersedia",
  LIMITED: "Stok Terbatas",
  SOLD: "Terjual",
};

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as ListingCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const CONDITION_OPTIONS = (Object.keys(CONDITION_LABELS) as ListingCondition[]).map((value) => ({
  value,
  label: CONDITION_LABELS[value],
}));

export const AVAILABILITY_OPTIONS = (Object.keys(AVAILABILITY_LABELS) as ListingAvailability[]).map((value) => ({
  value,
  label: AVAILABILITY_LABELS[value],
}));

export const MAX_PRICE = 100_000_000_000;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

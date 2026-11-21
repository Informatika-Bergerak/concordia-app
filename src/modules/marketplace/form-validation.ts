import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PRICE } from "./constants";
import { parseDigits } from "./format";
import type { ListingAvailability, ListingCategory, ListingCondition } from "./types";

export type ListingFormValues = {
  title: string;
  price: string;
  category: ListingCategory | "";
  condition: ListingCondition | "";
  availability: ListingAvailability | "";
  description: string;
  location: string;
  allowCod: boolean;
  allowShipping: boolean;
};

export type ListingFormErrors = Partial<Record<keyof ListingFormValues | "photo" | "preference", string>>;

export type PhotoInfo = { type: string; size: number };

/** Validasi sisi klien; validasi server tetap wajib saat backend Marketplace dibuat. */
export function validateListingForm(
  values: ListingFormValues,
  photo: PhotoInfo | null,
  options: { requirePhoto: boolean },
): ListingFormErrors {
  const errors: ListingFormErrors = {};
  const title = values.title.trim();
  const price = parseDigits(values.price);

  if (title.length < 3) errors.title = "Judul minimal 3 karakter.";
  else if (title.length > 100) errors.title = "Judul maksimal 100 karakter.";

  if (price === null || price <= 0) errors.price = "Masukkan harga lebih dari 0.";
  else if (price > MAX_PRICE) errors.price = "Harga terlalu besar.";

  if (!values.category) errors.category = "Pilih kategori.";
  if (!values.condition) errors.condition = "Pilih kondisi barang.";
  if (!values.availability) errors.availability = "Pilih ketersediaan barang.";

  if (values.description.trim().length < 10) errors.description = "Keterangan minimal 10 karakter.";
  else if (values.description.length > 2000) errors.description = "Keterangan maksimal 2000 karakter.";

  if (values.location.trim().length < 2) errors.location = "Isi lokasi penjualan.";

  if (!values.allowCod && !values.allowShipping) errors.preference = "Pilih minimal satu preferensi penjualan.";

  if (!photo) {
    if (options.requirePhoto) errors.photo = "Unggah cover image.";
  } else if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
    errors.photo = "Format gambar harus JPG, PNG, atau WebP.";
  } else if (photo.size > MAX_PHOTO_BYTES) {
    errors.photo = "Ukuran gambar maksimal 4 MB.";
  }

  return errors;
}

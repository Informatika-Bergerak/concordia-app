import { z } from "zod";
import {
  AVAILABILITY_OPTIONS,
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  MAX_PHOTO_BYTES,
  MAX_PRICE,
} from "./constants";
import type { ListingAvailability, ListingCategory, ListingCondition } from "./types";

// Validasi sisi server untuk tawaran. Aturan dan pesannya sengaja sama dengan
// `validateListingForm` (sisi klien) agar pengguna tidak melihat pesan yang berbeda.

const asTuple = <T extends string>(values: T[]) => values as [T, ...T[]];
const CATEGORY_VALUES = asTuple<ListingCategory>(CATEGORY_OPTIONS.map((o) => o.value));
const CONDITION_VALUES = asTuple<ListingCondition>(CONDITION_OPTIONS.map((o) => o.value));
const AVAILABILITY_VALUES = asTuple<ListingAvailability>(AVAILABILITY_OPTIONS.map((o) => o.value));

// Metadata foto hasil POST /api/upload. Dikirim dari browser, jadi divalidasi ketat agar
// pengguna tidak dapat menautkan berkas milik pihak lain.
export const listingPhotoSchema = z
  .object({
    url: z.string().url().startsWith("https://res.cloudinary.com/"),
    publicId: z.string().regex(/^concordia\/marketplace\/[A-Za-z0-9-]{36}$/, "Foto tidak valid"),
    format: z.enum(["jpg", "jpeg", "png", "webp"]).optional(),
    bytes: z.number().int().positive().max(MAX_PHOTO_BYTES, "Ukuran gambar maksimal 4 MB.").optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .refine((p) => p.url.includes(p.publicId), { message: "Foto tidak valid" });

const listingFields = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(100, "Judul maksimal 100 karakter."),
  price: z
    .number({ message: "Masukkan harga lebih dari 0." })
    .int("Harga harus bilangan bulat.")
    .positive("Masukkan harga lebih dari 0.")
    .max(MAX_PRICE, "Harga terlalu besar."),
  category: z.enum(CATEGORY_VALUES, { message: "Pilih kategori." }),
  condition: z.enum(CONDITION_VALUES, { message: "Pilih kondisi barang." }),
  availability: z.enum(AVAILABILITY_VALUES, { message: "Pilih ketersediaan barang." }),
  // Batas atas dihitung pada teks apa adanya (seperti di form); batas bawah pada teks yang dipangkas.
  description: z
    .string()
    .max(2000, "Keterangan maksimal 2000 karakter.")
    .trim()
    .min(10, "Keterangan minimal 10 karakter."),
  location: z.string().trim().min(2, "Isi lokasi penjualan.").max(120, "Lokasi maksimal 120 karakter."),
  allowCod: z.boolean(),
  allowShipping: z.boolean(),
});

const requirePreference = <T extends { allowCod: boolean; allowShipping: boolean }>(v: T) =>
  v.allowCod || v.allowShipping;
const PREFERENCE_ERROR = { path: ["preference"], message: "Pilih minimal satu preferensi penjualan." };

/** Tawaran baru: cover image wajib. */
export const createListingInputSchema = listingFields
  .extend({ photo: listingPhotoSchema })
  .refine(requirePreference, PREFERENCE_ERROR);

/** Ubah tawaran: `photo` tidak dikirim berarti foto tetap; objek berarti diganti. Foto tidak boleh dihapus. */
export const updateListingInputSchema = listingFields
  .extend({ listingId: z.number().int().positive(), photo: listingPhotoSchema.optional() })
  .refine(requirePreference, PREFERENCE_ERROR);

export const setListingActiveSchema = z.object({
  listingId: z.number().int().positive(),
  isActive: z.boolean(),
});

export const deleteListingSchema = z.object({
  listingId: z.number().int().positive(),
});

export type CreateListingInput = z.infer<typeof createListingInputSchema>;
export type UpdateListingInput = z.infer<typeof updateListingInputSchema>;

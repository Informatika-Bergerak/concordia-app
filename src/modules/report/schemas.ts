import { z } from "zod";

export const reportCategories = [
  "FASILITAS",
  "KEBERSIHAN",
  "KEAMANAN",
  "KEHILANGAN",
  "KEBIJAKAN",
  "LAINNYA",
] as const;

export const createReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Topik minimal 5 karakter")
    .max(100, "Topik maksimal 100 karakter"),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(1000, "Deskripsi maksimal 1000 karakter"),
  location: z
    .string()
    .trim()
    .min(3, "Lokasi minimal 3 karakter")
    .max(120, "Lokasi maksimal 120 karakter"),
  category: z.enum(reportCategories, { message: "Pilih kategori masalah" }),
  occurredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal tidak valid")
    .refine((v) => Date.parse(v) <= Date.now(), "Tanggal tidak boleh di masa depan"),
  visibility: z.enum(["PUBLIC", "ANONYMOUS", "PRIVATE"]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Metadata foto hasil POST /api/upload. Dikirim dari browser, jadi divalidasi ketat
// agar pengguna tidak bisa menautkan URL atau berkas milik pihak lain.
export const reportPhotoSchema = z
  .object({
    url: z.string().url().startsWith("https://res.cloudinary.com/"),
    publicId: z.string().regex(/^concordia\/reports\/[A-Za-z0-9-]{36}$/, "Foto tidak valid"),
    format: z.string().max(10).optional(),
    bytes: z.number().int().positive().max(4 * 1024 * 1024).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .refine((p) => p.url.includes(p.publicId), { message: "Foto tidak valid" });

export const createReportInputSchema = createReportSchema.extend({
  photo: reportPhotoSchema.nullish(),
});

export type CreateReportActionInput = z.infer<typeof createReportInputSchema>;

export const updateReportStatusSchema = z
  .object({
    reportId: z.number().int().positive(),
    status: z.enum(["UNVERIFIED", "VERIFIED", "REJECTED"]),
    note: z.string().trim().max(500, "Alasan maksimal 500 karakter").optional(),
  })
  .refine((v) => v.status !== "REJECTED" || (v.note && v.note.length >= 5), {
    path: ["note"],
    message: "Alasan penolakan wajib diisi (minimal 5 karakter)",
  });

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

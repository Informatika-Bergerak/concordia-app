import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Nama grup wajib diisi").max(100, "Nama grup terlalu panjang"),
  description: z.string().max(500, "Deskripsi terlalu panjang").optional().default(""),
  photo: z.string().url().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const sendMessageSchema = z.object({
  groupId: z.number().int().positive(),
  content: z.string().max(2000, "Pesan terlalu panjang").optional().default(""),
  imageUrl: z.string().url().optional(),
}).refine((data) => data.content.trim() || data.imageUrl, {
  message: "Pesan tidak boleh kosong",
});

export const groupIdSchema = z.object({
  groupId: z.number().int().positive(),
});

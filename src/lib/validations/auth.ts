import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[a-z]/, "Password harus mengandung huruf kecil")
  .regex(/[A-Z]/, "Password harus mengandung huruf besar")
  .regex(/[0-9]/, "Password harus mengandung angka")
  .regex(/[^A-Za-z0-9]/, "Password harus mengandung karakter khusus");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(4, "Username minimal 4 karakter")
  .max(20, "Username maksimal 20 karakter")
  .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore");

// Saat login, aturan password tidak perlu diulang, cukup tidak kosong
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});
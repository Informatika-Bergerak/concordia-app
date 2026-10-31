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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Password baru tidak boleh sama dengan password lama",
    path: ["newPassword"],
  });

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  username: usernameSchema,
  accountType: z.enum(["MAHASISWA", "DOSEN", "MODERATOR", "ADMIN"], {
    message: "Pilih tipe akun",
  }),
});
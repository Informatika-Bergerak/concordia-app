"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth/guards";
import { generateTempPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { createUserSchema } from "@/lib/validations/auth";
import type { Role } from "@/generated/prisma/enums";

export type CreateUserState = {
  error?: string;
  created?: { name: string; username: string; password: string };
};

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireRole(["ADMIN"]);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    accountType: formData.get("accountType"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, username, accountType } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { error: "Username sudah dipakai" };

  const role: Role =
    accountType === "ADMIN" ? "ADMIN" : accountType === "MODERATOR" ? "MODERATOR" : "USER";
  const userType =
    accountType === "MAHASISWA" || accountType === "DOSEN" ? accountType : null;

  const password = generateTempPassword();

  await prisma.user.create({
    data: {
      name,
      username,
      role,
      userType,
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin/users");
  return { created: { name, username, password } };
}

export async function resetPasswordAction(
  userId: string,
): Promise<{ error?: string; password?: string }> {
  await requireRole(["ADMIN"]);

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { error: "Akun tidak ditemukan" };

  const password = generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true },
  });

  return { password };
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  const { user: admin } = await requireRole(["ADMIN"]);

  const userId = formData.get("userId");
  if (typeof userId !== "string" || userId === admin.id) return; // tidak boleh menonaktifkan diri sendiri

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  if (!target) return;

  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
  revalidatePath("/admin/users");
}
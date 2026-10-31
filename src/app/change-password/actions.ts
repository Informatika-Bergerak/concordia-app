"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations/auth";

export type ChangePasswordState = { error?: string };

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir, silakan login ulang" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { error: "Akun tidak ditemukan" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!valid) return { error: "Password lama salah" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
      mustChangePassword: false,
    },
  });

  redirect(homeByRole[user.role]);
}
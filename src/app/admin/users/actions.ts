"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth/guards";
import { generateTempPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { createUserSchema } from "@/lib/validations/auth";
import type { Role } from "@/generated/prisma/enums";
import { clearFailures } from "@/lib/auth/rate-limit";
import { logAudit } from "@/lib/audit/log";
import { getRequestMeta } from "@/lib/audit/request-meta";

export type CreateUserState = {
  error?: string;
  created?: { name: string; username: string; password: string };
  values?: { name: string; username: string; accountType: string };
};

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const { user: admin } = await requireRole(["ADMIN"]);

  const rawName = String(formData.get("name") ?? "");
  const rawUsername = String(formData.get("username") ?? "");
  const rawAccountType = String(formData.get("accountType") ?? "");

  const currentValues = {
    name: rawName,
    username: rawUsername,
    accountType: rawAccountType,
  };

  // Cegah pembuatan akun admin dari server sebelum parse skema
  if (rawAccountType === "ADMIN") {
    return {
      error: "Akun admin tidak bisa dibuat dari panel ini.",
      values: currentValues,
    };
  }

  const parsed = createUserSchema.safeParse({
    name: rawName,
    username: rawUsername,
    accountType: rawAccountType,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      values: currentValues,
    };
  }

  const { name, username, accountType } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    return {
      error: "Username sudah dipakai",
      values: currentValues,
    };
  }

  // Pemetaan role yang aman: tidak ada kemungkinan menghasilkan role ADMIN
  const role: Role = accountType === "MODERATOR" ? "MODERATOR" : "USER";
  const userType =
    accountType === "MAHASISWA" || accountType === "DOSEN" ? accountType : null;

  const password = generateTempPassword();

  const createdUser = await prisma.user.create({
    data: {
      name,
      username,
      role,
      userType,
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
    },
  });

  const meta = await getRequestMeta();
  await logAudit({
    action: "ACCOUNT_CREATED",
    actor: { id: admin.id, username: admin.username },
    target: { id: createdUser.id, username: createdUser.username },
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { accountType },
  });

  revalidatePath("/admin/users");
  return { created: { name, username, password } };
}

export async function resetPasswordAction(
  userId: number,
): Promise<{ error?: string; password?: string }> {
  const { user: admin } = await requireRole(["ADMIN"]);

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });
  if (!target) return { error: "Akun tidak ditemukan" };

  const password = generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
      // Reset password mencabut seluruh sesi aktif perangkat lama
      activeSessionId: null,
      lastSeenAt: null,
      activeDevice: null,
    },
  });
  await clearFailures(target.username);

  const meta = await getRequestMeta();
  await logAudit({
    action: "PASSWORD_RESET",
    actor: { id: admin.id, username: admin.username },
    target: { id: target.id, username: target.username },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { password };
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  const { user: admin } = await requireRole(["ADMIN"]);

  const raw = formData.get("userId");
  const userId = Number(raw);
  if (!Number.isInteger(userId) || userId === admin.id) return; // tidak boleh menonaktifkan diri sendiri

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, isActive: true },
  });
  if (!target) return;

  const nextIsActive = !target.isActive;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: nextIsActive,
      // Saat menonaktifkan, cabut sesi aktif
      ...(nextIsActive
        ? {}
        : {
            activeSessionId: null,
            lastSeenAt: null,
            activeDevice: null,
          }),
    },
  });

  const meta = await getRequestMeta();
  await logAudit({
    action: nextIsActive ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
    actor: { id: admin.id, username: admin.username },
    target: { id: target.id, username: target.username },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/admin/users");
}

export async function forceLogoutUserAction(
  userId: number,
): Promise<{ error?: string }> {
  const { user: admin } = await requireRole(["ADMIN"]);

  if (!Number.isInteger(userId)) return { error: "ID pengguna tidak valid" };
  if (userId === admin.id) return { error: "Tidak bisa mencabut sesi akun sendiri" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });
  if (!target) return { error: "Akun tidak ditemukan" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      activeSessionId: null,
      lastSeenAt: null,
      activeDevice: null,
    },
  });

  const meta = await getRequestMeta();
  await logAudit({
    action: "SESSION_REVOKED",
    actor: { id: admin.id, username: admin.username },
    target: { id: target.id, username: target.username },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/admin/users");
  return {};
}

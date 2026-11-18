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
import { z } from "zod";

export type CreateUserState = {
  error?: string;
  created?: { name: string; username: string; password: string };
  values?: { name: string; username: string; accountType: string };
};

const updateUserProfileSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  nickname: z.string().trim().max(50, "Nickname maksimal 50 karakter."),
  username: z.string().trim().toLowerCase().min(1).max(64),
  userType: z.enum(["MAHASISWA", "DOSEN"]).nullable(),
  jurusan: z.string().trim().max(100, "Jurusan maksimal 100 karakter."),
}).strict();

export async function updateUserProfileAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user: admin } = await requireRole(["ADMIN"]);
  const parsed = updateUserProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data pengguna tidak valid" };
  const { id, name, nickname, username, userType, jurusan } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
  if (!target) return { ok: false, error: "Akun tidak ditemukan" };
  const duplicate = await prisma.user.findFirst({ where: { username, NOT: { id } }, select: { id: true } });
  if (duplicate) return { ok: false, error: "Username sudah dipakai" };

  await prisma.user.update({
    where: { id },
    data: { name, nickname: nickname || null, username, userType, jurusan: jurusan || null },
  });
  const meta = await getRequestMeta();
  await logAudit({
    action: "ACCOUNT_UPDATED",
    actor: { id: admin.id, username: admin.username },
    target: { id, username },
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { fields: ["name", "nickname", "username", "userType", "jurusan"] },
  });
  revalidatePath("/admin/users");
  revalidatePath("/profil");
  revalidatePath("/beranda");
  return { ok: true };
}

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const { user: admin } = await requireRole(["ADMIN"]);
  const rawName = String(formData.get("name") ?? "");
  const rawUsername = String(formData.get("username") ?? "");
  const rawAccountType = String(formData.get("accountType") ?? "");
  const currentValues = { name: rawName, username: rawUsername, accountType: rawAccountType };
  if (rawAccountType === "ADMIN") return { error: "Akun admin tidak bisa dibuat dari panel ini.", values: currentValues };
  const parsed = createUserSchema.safeParse({ name: rawName, username: rawUsername, accountType: rawAccountType });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: currentValues };
  const { name, username, accountType } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { error: "Username sudah dipakai", values: currentValues };
  const role: Role = accountType === "MODERATOR" ? "MODERATOR" : "USER";
  const userType = accountType === "MAHASISWA" || accountType === "DOSEN" ? accountType : null;
  const password = generateTempPassword();
  const createdUser = await prisma.user.create({ data: { name, username, role, userType, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true } });
  const meta = await getRequestMeta();
  await logAudit({ action: "ACCOUNT_CREATED", actor: { id: admin.id, username: admin.username }, target: { id: createdUser.id, username: createdUser.username }, ip: meta.ip, userAgent: meta.userAgent, metadata: { accountType } });
  revalidatePath("/admin/users");
  return { created: { name, username, password } };
}

export async function resetPasswordAction(userId: number): Promise<{ error?: string; password?: string }> {
  const { user: admin } = await requireRole(["ADMIN"]);
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
  if (!target) return { error: "Akun tidak ditemukan" };
  const password = generateTempPassword();
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true, activeSessionId: null, lastSeenAt: null, activeDevice: null } });
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
  if (!Number.isInteger(userId) || userId === admin.id) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, isActive: true } });
  if (!target) return;
  const nextIsActive = !target.isActive;
  await prisma.user.update({ where: { id: userId }, data: { isActive: nextIsActive, ...(nextIsActive ? {} : { activeSessionId: null, lastSeenAt: null, activeDevice: null }) } });
  const meta = await getRequestMeta();
  await logAudit({ action: nextIsActive ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED", actor: { id: admin.id, username: admin.username }, target: { id: target.id, username: target.username }, ip: meta.ip, userAgent: meta.userAgent });
  revalidatePath("/admin/users");
}

export async function forceLogoutUserAction(userId: number): Promise<{ error?: string }> {
  const { user: admin } = await requireRole(["ADMIN"]);
  if (!Number.isInteger(userId) || userId === admin.id) return { error: "Tidak bisa mencabut sesi akun sendiri" };
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
  if (!target) return { error: "Akun tidak ditemukan" };
  await prisma.user.update({ where: { id: userId }, data: { activeSessionId: null, lastSeenAt: null, activeDevice: null } });
  const meta = await getRequestMeta();
  await logAudit({ action: "SESSION_REVOKED", actor: { id: admin.id, username: admin.username }, target: { id: target.id, username: target.username }, ip: meta.ip, userAgent: meta.userAgent });
  revalidatePath("/admin/users");
  return {};
}

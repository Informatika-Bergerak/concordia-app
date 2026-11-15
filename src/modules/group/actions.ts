"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { createGroupSchema, sendMessageSchema } from "./schemas";
import { z } from "zod";

export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/**
 * Membuat grup baru.
 * Pembuat otomatis menjadi anggota dengan role OWNER.
 */
export async function createGroupAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { name, description, photo } = parsed.data;

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        photo: photo ?? null,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
      select: { id: true },
    });

    revalidatePath("/grup");
    return { ok: true, id: group.id };
  } catch (error) {
    console.error("[group] Gagal membuat grup:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan grup, coba lagi" };
  }
}

/**
 * Mengirim pesan ke grup.
 * Hanya anggota grup yang boleh mengirim pesan.
 */
export async function sendGroupMessageAction(
  input: unknown,
): Promise<ActionResult<{ messageId: number }>> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { groupId, content } = parsed.data;

  // Pastikan pengguna adalah anggota grup
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
    select: { id: true },
  });
  if (!membership) {
    return { ok: false, error: "Kamu bukan anggota grup ini" };
  }

  try {
    const [message] = await prisma.$transaction([
      prisma.groupMessage.create({
        data: {
          groupId,
          senderId: user.id,
          content,
        },
        select: { id: true },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
      }),
    ]);

    revalidatePath(`/grup/${groupId}`);
    revalidatePath("/grup");
    return { ok: true, messageId: message.id };
  } catch (error) {
    console.error("[group] Gagal mengirim pesan:", (error as Error).message);
    return { ok: false, error: "Gagal mengirim pesan, coba lagi" };
  }
}

const groupMemberInput = z.object({ groupId: z.number().int().positive(), userId: z.number().int().positive() });
const messageMutationInput = z.object({ groupId: z.number().int().positive(), messageId: z.number().int().positive(), content: z.string().min(1).max(2000).optional() });

async function requireGroupManager(groupId: number, userId: number) {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { role: true } });
  return membership && (membership.role === "OWNER" || membership.role === "ADMIN") ? membership : null;
}

export async function addGroupMemberAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = groupMemberInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data anggota tidak valid" };
  if (!(await requireGroupManager(parsed.data.groupId, user.id))) return { ok: false, error: "Hanya admin grup yang dapat menambahkan anggota" };
  try { await prisma.groupMember.create({ data: parsed.data }); revalidatePath(`/grup/${parsed.data.groupId}`); return { ok: true }; }
  catch { return { ok: false, error: "Pengguna sudah menjadi anggota atau tidak valid" }; }
}

export async function removeGroupMemberAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = groupMemberInput.safeParse(input);
  if (!parsed.success || parsed.data.userId === user.id || !(await requireGroupManager(parsed.data.groupId, user.id))) return { ok: false, error: "Tidak dapat menghapus anggota ini" };
  const target = await prisma.groupMember.findUnique({ where: { groupId_userId: parsed.data }, select: { role: true } });
  if (!target || target.role === "OWNER") return { ok: false, error: "Pemilik grup tidak dapat dihapus" };
  await prisma.groupMember.delete({ where: { groupId_userId: parsed.data } }); revalidatePath(`/grup/${parsed.data.groupId}`); return { ok: true };
}

export async function editGroupMessageAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]); const parsed = messageMutationInput.safeParse(input);
  if (!parsed.success || !parsed.data.content) return { ok: false, error: "Pesan tidak valid" };
  const message = await prisma.groupMessage.findUnique({ where: { id: parsed.data.messageId }, select: { groupId: true, senderId: true, deletedAt: true } });
  if (!message || message.groupId !== parsed.data.groupId || message.senderId !== user.id || message.deletedAt) return { ok: false, error: "Pesan tidak dapat diedit" };
  await prisma.groupMessage.update({ where: { id: parsed.data.messageId }, data: { content: parsed.data.content } }); revalidatePath(`/grup/${message.groupId}`); return { ok: true };
}

export async function deleteGroupMessageAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]); const parsed = messageMutationInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pesan tidak valid" };
  const message = await prisma.groupMessage.findUnique({ where: { id: parsed.data.messageId }, select: { groupId: true, senderId: true, deletedAt: true } });
  if (!message || message.groupId !== parsed.data.groupId || message.deletedAt) return { ok: false, error: "Pesan tidak dapat dihapus" };
  if (message.senderId !== user.id && !(await requireGroupManager(message.groupId, user.id))) return { ok: false, error: "Tidak memiliki izin" };
  await prisma.groupMessage.update({ where: { id: parsed.data.messageId }, data: { deletedAt: new Date() } }); revalidatePath(`/grup/${message.groupId}`); return { ok: true };
}

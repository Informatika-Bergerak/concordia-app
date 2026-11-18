"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { createGroupSchema, sendMessageSchema, groupIdSchema } from "./schemas";
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

  const { name, description, photo, visibility } = parsed.data;

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        photo: photo ?? null,
        visibility,
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
const joinGroupInput = z.object({ groupId: z.number().int().positive() });
const joinRequestDecisionInput = groupMemberInput.extend({ decision: z.enum(["ACCEPT", "REJECT"]) });

export async function joinPublicGroupAction(input: unknown): Promise<ActionResult<{ status: "PENDING" }>> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = joinGroupInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Grup tidak valid" };
  const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId }, select: { visibility: true } });
  if (!group || group.visibility !== "PUBLIC") return { ok: false, error: "Grup tidak tersedia untuk publik" };

  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: parsed.data.groupId, userId: user.id } }, select: { id: true } });
  if (membership) return { ok: false, error: "Kamu sudah menjadi anggota grup ini" };

  try {
    await prisma.groupJoinRequest.upsert({
      where: { groupId_userId: { groupId: parsed.data.groupId, userId: user.id } },
      create: { groupId: parsed.data.groupId, userId: user.id },
      update: { status: "PENDING" },
    });
    revalidatePath("/grup");
    revalidatePath(`/grup/${parsed.data.groupId}`);
    return { ok: true, status: "PENDING" };
  } catch {
    return { ok: false, error: "Gagal mengajukan permintaan masuk grup" };
  }
}

export async function decideGroupJoinRequestAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = joinRequestDecisionInput.safeParse(input);
  if (!parsed.success || !(await requireGroupManager(parsed.data.groupId, user.id))) return { ok: false, error: "Tidak memiliki izin" };
  if (parsed.data.userId === user.id) return { ok: false, error: "Tidak dapat memproses permintaan sendiri" };

  const request = await prisma.groupJoinRequest.findUnique({ where: { groupId_userId: { groupId: parsed.data.groupId, userId: parsed.data.userId } }, select: { status: true } });
  if (!request || request.status !== "PENDING") return { ok: false, error: "Permintaan sudah diproses" };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.decision === "ACCEPT") {
      await tx.groupMember.upsert({
        where: { groupId_userId: { groupId: parsed.data.groupId, userId: parsed.data.userId } },
        create: { groupId: parsed.data.groupId, userId: parsed.data.userId, role: "MEMBER" },
        update: {},
      });
    }
    await tx.groupJoinRequest.delete({ where: { groupId_userId: { groupId: parsed.data.groupId, userId: parsed.data.userId } } });
  });
  revalidatePath(`/grup/${parsed.data.groupId}`);
  revalidatePath("/grup");
  return { ok: true };
}

const messageMutationInput = z.object({ groupId: z.number().int().positive(), messageId: z.number().int().positive(), content: z.string().min(1).max(2000).optional() });

async function requireGroupManager(groupId: number, userId: number) {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { role: true } });
  return membership && (membership.role === "OWNER" || membership.role === "ADMIN") ? membership : null;
}

async function requireGroupOwner(groupId: number, userId: number) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { creatorId: true } });
  return group?.creatorId === userId;
}

export async function updateGroupMemberRoleAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = groupMemberInput.extend({ role: z.enum(["ADMIN", "MEMBER"]) }).safeParse(input);
  if (!parsed.success || !(await requireGroupManager(parsed.data.groupId, user.id))) return { ok: false, error: "Hanya pembuat grup atau admin yang dapat mengubah role" };
  if (parsed.data.userId === user.id) return { ok: false, error: "Role pembuat grup tidak dapat diubah" };
  const target = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: parsed.data.groupId, userId: parsed.data.userId } }, select: { role: true } });
  if (!target || target.role === "OWNER") return { ok: false, error: "Anggota tidak ditemukan" };
  await prisma.groupMember.update({ where: { groupId_userId: { groupId: parsed.data.groupId, userId: parsed.data.userId } }, data: { role: parsed.data.role } });
  revalidatePath(`/grup/${parsed.data.groupId}`);
  return { ok: true };
}

export async function deleteGroupAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = groupIdSchema.safeParse(input);
  if (!parsed.success || !(await requireGroupOwner(parsed.data.groupId, user.id))) return { ok: false, error: "Hanya pembuat grup yang dapat menghapus grup" };
  await prisma.group.delete({ where: { id: parsed.data.groupId } });
  revalidatePath("/grup");
  return { ok: true };
}

export async function leaveGroupAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = groupIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Grup tidak valid" };
  const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId }, select: { creatorId: true } });
  if (!group || group.creatorId === user.id) return { ok: false, error: "Pembuat grup harus mengalihkan kepemilikan terlebih dahulu" };
  await prisma.groupMember.delete({ where: { groupId_userId: { groupId: parsed.data.groupId, userId: user.id } } });
  revalidatePath("/grup"); revalidatePath(`/grup/${parsed.data.groupId}`);
  return { ok: true };
}

const updateGroupInput = z.object({ groupId: z.number().int().positive(), name: z.string().trim().min(1).max(100).optional(), description: z.string().max(500).optional(), photo: z.string().url().nullable().optional(), visibility: z.enum(["PUBLIC", "PRIVATE"]).optional() });

export async function updateGroupAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = updateGroupInput.safeParse(input);
  if (!parsed.success || (!parsed.data.name && parsed.data.description === undefined && parsed.data.photo === undefined && parsed.data.visibility === undefined)) return { ok: false, error: "Data grup tidak valid" };
  if (!(await requireGroupManager(parsed.data.groupId, user.id))) return { ok: false, error: "Tidak memiliki izin" };
  const updateData = { ...(parsed.data.name ? { name: parsed.data.name } : {}), ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}), ...(parsed.data.photo !== undefined ? { photo: parsed.data.photo } : {}), ...(parsed.data.visibility !== undefined ? { visibility: parsed.data.visibility } : {}) };
  if (parsed.data.visibility !== undefined && !(await requireGroupOwner(parsed.data.groupId, user.id))) return { ok: false, error: "Hanya pembuat grup yang dapat mengubah privasi grup" };
  await prisma.group.update({ where: { id: parsed.data.groupId }, data: updateData });
  revalidatePath(`/grup/${parsed.data.groupId}`); revalidatePath("/grup"); return { ok: true };
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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export type FriendActionResult = { ok: true } | { ok: false; error: string };

const userIdSchema = z.object({ userId: z.coerce.number().int().positive() });
const requestSchema = z.object({ requestId: z.coerce.number().int().positive() });

function refreshFriends() {
  revalidatePath("/search");
  revalidatePath("/teman");
}

export async function sendFriendRequestAction(input: unknown): Promise<FriendActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success || parsed.data.userId === user.id) return { ok: false, error: "Pengguna tidak valid" };

  const target = await prisma.user.findFirst({ where: { id: parsed.data.userId, isActive: true }, select: { id: true } });
  if (!target) return { ok: false, error: "Pengguna tidak ditemukan" };

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { requesterId: user.id, recipientId: target.id },
        { requesterId: target.id, recipientId: user.id },
      ],
    },
    select: { id: true, requesterId: true, recipientId: true, status: true },
  });

  if (existing?.status === "ACCEPTED") return { ok: false, error: "Kalian sudah berteman" };
  if (existing?.status === "PENDING") return { ok: false, error: "Permintaan pertemanan sudah ada" };

  try {
    if (existing) {
      await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { requesterId: user.id, recipientId: target.id, status: "PENDING" },
      });
    } else {
      await prisma.friendRequest.create({ data: { requesterId: user.id, recipientId: target.id } });
    }
  } catch (error) {
    console.error("[friends] Gagal mengirim permintaan:", (error as Error).message);
    return { ok: false, error: "Gagal mengirim permintaan, coba lagi" };
  }

  refreshFriends();
  return { ok: true };
}

export async function respondFriendRequestAction(input: unknown, accept: boolean): Promise<FriendActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Permintaan tidak valid" };

  const request = await prisma.friendRequest.findFirst({
    where: { id: parsed.data.requestId, recipientId: user.id, status: "PENDING" },
    select: { id: true },
  });
  if (!request) return { ok: false, error: "Permintaan tidak ditemukan" };

  await prisma.friendRequest.update({
    where: { id: request.id },
    data: { status: accept ? "ACCEPTED" : "REJECTED" },
  });
  refreshFriends();
  return { ok: true };
}

export async function acceptFriendRequestAction(input: unknown) {
  return respondFriendRequestAction(input, true);
}

export async function rejectFriendRequestAction(input: unknown) {
  return respondFriendRequestAction(input, false);
}

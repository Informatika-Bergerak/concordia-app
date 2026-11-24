"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

const eventInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().trim().min(1).max(300),
  isOnline: z.boolean(),
  groupId: z.coerce.number().int().positive().nullable(),
  groupName: z.string().trim().max(100).nullable(),
  category: z.string().trim().min(1).max(50),
  coverImage: z.string().nullable(),
});

const idInput = z.object({ eventId: z.coerce.number().int().positive() });

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function createEventAction(input: unknown) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = eventInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Data event tidak valid" };
  const value = parsed.data;
  if (value.groupId !== null) {
    const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: value.groupId, userId: user.id } }, select: { group: { select: { name: true } } } });
    if (!membership) return { ok: false as const, error: "Kamu belum bergabung dengan grup tersebut" };
    value.groupName = membership.group.name;
  }
  if (new Date(`${value.endDate}T${value.endTime}`) < new Date(`${value.startDate}T${value.startTime}`)) {
    return { ok: false as const, error: "Tanggal dan waktu selesai tidak boleh sebelum tanggal mulai" };
  }

  const event = await prisma.event.create({
    data: {
      ...value,
      startDate: date(value.startDate),
      endDate: date(value.endDate),
      creatorId: user.id,
      participants: { create: { userId: user.id } },
    },
    select: { id: true },
  });
  revalidatePath("/event");
  return { ok: true as const, id: String(event.id) };
}

export async function updateEventAction(input: unknown) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = eventInput.extend({ eventId: z.coerce.number().int().positive() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Data event tidak valid" };
  const { eventId, ...value } = parsed.data;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { creatorId: true } });
  if (value.groupId !== null) {
    const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: value.groupId, userId: user.id } }, select: { group: { select: { name: true } } } });
    if (!membership) return { ok: false as const, error: "Kamu belum bergabung dengan grup tersebut" };
    value.groupName = membership.group.name;
  }
  if (!event || (event.creatorId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR")) return { ok: false as const, error: "Tidak memiliki izin" };
  await prisma.event.update({ where: { id: eventId }, data: { ...value, startDate: date(value.startDate), endDate: date(value.endDate) } });
  revalidatePath("/event");
  return { ok: true as const };
}

export async function cancelEventAction(input: unknown) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = idInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Event tidak valid" };
  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId }, select: { creatorId: true } });
  if (!event || (event.creatorId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR")) return { ok: false as const, error: "Tidak memiliki izin" };
  await prisma.event.update({ where: { id: parsed.data.eventId }, data: { status: "CANCELLED" } });
  revalidatePath("/event");
  return { ok: true as const };
}

export async function deleteEventAction(input: unknown) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = idInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Event tidak valid" };
  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId }, select: { creatorId: true } });
  if (!event || (event.creatorId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR")) return { ok: false as const, error: "Tidak memiliki izin" };
  await prisma.event.delete({ where: { id: parsed.data.eventId } });
  revalidatePath("/event");
  return { ok: true as const };
}

export async function toggleEventParticipationAction(input: unknown) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = idInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Event tidak valid" };
  const where = { eventId_userId: { eventId: parsed.data.eventId, userId: user.id } };
  const existing = await prisma.eventParticipant.findUnique({ where });
  if (existing) await prisma.eventParticipant.delete({ where });
  else await prisma.eventParticipant.create({ data: { eventId: parsed.data.eventId, userId: user.id } });
  revalidatePath("/event");
  return { ok: true as const, joined: !existing };
}

export async function toggleEventInterestAction(input: unknown) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = idInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Event tidak valid" };
  const where = { eventId_userId: { eventId: parsed.data.eventId, userId: user.id } };
  const existing = await prisma.eventInterest.findUnique({ where });
  if (existing) await prisma.eventInterest.delete({ where });
  else await prisma.eventInterest.create({ data: { eventId: parsed.data.eventId, userId: user.id } });
  revalidatePath("/event");
  return { ok: true as const, interested: !existing };
}

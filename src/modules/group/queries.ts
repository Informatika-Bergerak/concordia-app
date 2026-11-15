import { prisma } from "@/lib/db";
import type {
  GroupListItem,
  GroupDetail,
  GroupChatMessage,
  GroupMemberListItem
} from "./types";

/**
 * Ambil daftar grup yang diikuti / dimiliki oleh pengguna.
 * Termasuk jumlah anggota dan pesan terakhir.
 */
export async function getUserGroups(userId: number): Promise<GroupListItem[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          photo: true,
          createdAt: true,
          _count: { select: { members: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: "desc" } },
  });

  // Kumpulkan senderId pesan terakhir yang perlu dicari nama-nya
  const senderIds = memberships
    .map((m) => m.group.messages[0]?.senderId)
    .filter((id): id is number => id !== undefined);

  const uniqueSenderIds = [...new Set(senderIds)];
  const senders =
    uniqueSenderIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueSenderIds } },
          select: { id: true, name: true },
        })
      : [];
  const senderMap = new Map(senders.map((s) => [s.id, s.name]));

  return memberships.map(({ group }) => {
    const lastMsg = group.messages[0];
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      photo: group.photo,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            senderName: senderMap.get(lastMsg.senderId) ?? "Unknown",
            createdAt: lastMsg.createdAt,
          }
        : null,
    };
  });
}

/**
 * Ambil detail sebuah grup (hanya jika pengguna adalah anggota).
 */
export async function getGroupDetail(
  groupId: number,
  userId: number,
): Promise<GroupDetail | null> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  if (!membership) return null;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      photo: true,
      creatorId: true,
      _count: { select: { members: true } },
    },
  });
  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    photo: group.photo,
    creatorId: group.creatorId,
    memberCount: group._count.members,
  };
}

/**
 * Ambil riwayat pesan grup (50 pesan terakhir).
 */
export async function getGroupMessages(
  groupId: number,
  userId: number,
  cursor?: number,
): Promise<GroupChatMessage[]> {
  // Pastikan pengguna adalah anggota
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  if (!membership) return [];

  const messages = await prisma.groupMessage.findMany({
    where: { groupId, deletedAt: null, ...(cursor ? { id: { lt: cursor } } : {}) },
    take: 50,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      senderId: true,
    },
  });

  if (messages.length === 0) return [];

  // Ambil nama semua pengirim
  const uniqueSenderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = await prisma.user.findMany({
    where: { id: { in: uniqueSenderIds } },
    select: { id: true, name: true },
  });
  const senderMap = new Map(senders.map((s) => [s.id, s.name]));

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    deletedAt: m.deletedAt,
    senderId: m.senderId,
    senderName: senderMap.get(m.senderId) ?? "Unknown",
  }));
}

/** Ambil daftar anggota grup untuk anggota grup yang terautentikasi. */
export async function getGroupMembers(groupId: number, userId: number): Promise<GroupMemberListItem[]> {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } });
  if (!membership) return [];
  const members = await prisma.groupMember.findMany({ where: { groupId }, orderBy: { joinedAt: "asc" }, select: { id: true, userId: true, role: true, joinedAt: true } });
  const users = await prisma.user.findMany({ where: { id: { in: members.map((m) => m.userId) } }, select: { id: true, name: true, fotoProfil: true } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  return members.map((m) => ({ id: m.id, userId: m.userId, name: userMap.get(m.userId)?.name ?? "Unknown", role: m.role, photo: userMap.get(m.userId)?.fotoProfil ?? null, joinedAt: m.joinedAt }));
}

/** Cari pengguna aktif yang belum menjadi anggota grup. */
export async function searchPotentialMembers(groupId: number, query: string) {
  if (!query.trim()) return [];
  const members = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
  const users = await prisma.user.findMany({ where: { id: { notIn: members.map((m) => m.userId) }, isActive: true, OR: [{ name: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] }, take: 10, select: { id: true, name: true, fotoProfil: true } });
  return users.map((u) => ({ id: u.id, name: u.name, photo: u.fotoProfil }));
}

/**
 * Cari grup berdasarkan nama (yang pengguna ikuti).
 */
export async function searchUserGroups(
  userId: number,
  query: string,
): Promise<GroupListItem[]> {
  if (!query.trim()) return getUserGroups(userId);

  const memberships = await prisma.groupMember.findMany({
    where: {
      userId,
      group: {
        name: { contains: query, mode: "insensitive" },
      },
    },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          photo: true,
          createdAt: true,
          _count: { select: { members: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: "desc" } },
  });

  const senderIds = memberships
    .map((m) => m.group.messages[0]?.senderId)
    .filter((id): id is number => id !== undefined);
  const uniqueSenderIds = [...new Set(senderIds)];
  const senders =
    uniqueSenderIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueSenderIds } },
          select: { id: true, name: true },
        })
      : [];
  const senderMap = new Map(senders.map((s) => [s.id, s.name]));

  return memberships.map(({ group }) => {
    const lastMsg = group.messages[0];
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      photo: group.photo,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            senderName: senderMap.get(lastMsg.senderId) ?? "Unknown",
            createdAt: lastMsg.createdAt,
          }
        : null,
    };
  });
}

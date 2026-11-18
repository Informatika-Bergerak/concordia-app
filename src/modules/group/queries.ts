import { prisma } from "@/lib/db";
import type { GroupListItem, GroupDetail, GroupChatMessage, GroupMemberListItem, GroupJoinRequestListItem } from "./types";

export async function getPublicGroups(userId: number, query = "") {
  const groups = await prisma.group.findMany({
    where: {
      visibility: "PUBLIC",
      members: { none: { userId } },
      ...(query.trim() ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }, { creator: { name: { contains: query, mode: "insensitive" } } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, description: true, photo: true, creator: { select: { name: true } }, members: { where: { userId }, select: { id: true } }, _count: { select: { members: true } } },
  });
  const requestStatuses = await prisma.groupJoinRequest.findMany({ where: { userId, status: { in: ["PENDING", "REJECTED"] }, groupId: { in: groups.map((group) => group.id) } }, select: { groupId: true, status: true } });
  const statusMap = new Map(requestStatuses.map((request) => [request.groupId, request.status]));
  return groups.map(({ members, _count, ...group }) => ({ ...group, memberCount: _count.members, isMember: members.length > 0, requestStatus: statusMap.get(group.id) ?? null }));
}

export async function getUserGroups(userId: number): Promise<GroupListItem[]> {
  const memberships = await prisma.groupMember.findMany({ where: { userId }, select: { group: { select: { id: true, name: true, description: true, photo: true, createdAt: true, _count: { select: { members: true } }, messages: { where: { deletedAt: null }, take: 1, orderBy: { createdAt: "desc" }, select: { content: true, createdAt: true, senderId: true } } } } }, orderBy: { group: { updatedAt: "desc" } } });
  const senderIds = memberships.flatMap(({ group }) => group.messages.map((message) => message.senderId));
  const senders = senderIds.length ? await prisma.user.findMany({ where: { id: { in: [...new Set(senderIds)] } }, select: { id: true, name: true } }) : [];
  const senderMap = new Map(senders.map((sender) => [sender.id, sender.name]));
  return memberships.map(({ group }) => { const last = group.messages[0]; return { id: group.id, name: group.name, description: group.description, photo: group.photo, createdAt: group.createdAt, memberCount: group._count.members, lastMessage: last ? { content: last.content, senderName: senderMap.get(last.senderId) ?? "Unknown", createdAt: last.createdAt } : null }; });
}

export async function getGroupDetail(groupId: number, userId: number): Promise<GroupDetail | null> {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } });
  if (!membership) return null;
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, name: true, description: true, photo: true, visibility: true, creatorId: true, creator: { select: { name: true } }, _count: { select: { members: true } } } });
  if (!group) return null;
  return { ...group, creatorName: group.creator.name, memberCount: group._count.members };
}

export async function getGroupMessages(groupId: number, userId: number, cursor?: number): Promise<GroupChatMessage[]> {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } });
  if (!membership) return [];
  const messages = await prisma.groupMessage.findMany({ where: { groupId, deletedAt: null, ...(cursor ? { id: { lt: cursor } } : {}) }, take: 50, orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, updatedAt: true, deletedAt: true, senderId: true } });
  const senders = messages.length ? await prisma.user.findMany({ where: { id: { in: [...new Set(messages.map((message) => message.senderId))] } }, select: { id: true, name: true } }) : [];
  const senderMap = new Map(senders.map((sender) => [sender.id, sender.name]));
  return messages.map((message) => ({ ...message, senderName: senderMap.get(message.senderId) ?? "Unknown" }));
}

export async function getGroupMembers(groupId: number, userId: number): Promise<GroupMemberListItem[]> {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } });
  if (!membership) return [];
  const members = await prisma.groupMember.findMany({ where: { groupId }, orderBy: { joinedAt: "asc" }, select: { id: true, userId: true, role: true, joinedAt: true } });
  const users = await prisma.user.findMany({ where: { id: { in: members.map((member) => member.userId) } }, select: { id: true, name: true, fotoProfil: true } });
  const userMap = new Map(users.map((user) => [user.id, user]));
  return members.map((member) => ({ id: member.id, userId: member.userId, name: userMap.get(member.userId)?.name ?? "Unknown", role: member.role, photo: userMap.get(member.userId)?.fotoProfil ?? null, joinedAt: member.joinedAt }));
}

export async function getGroupJoinRequests(groupId: number, userId: number): Promise<GroupJoinRequestListItem[]> {
  const manager = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { role: true } });
  if (!manager || (manager.role !== "OWNER" && manager.role !== "ADMIN")) return [];
  const requests = await prisma.groupJoinRequest.findMany({ where: { groupId, status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, userId: true, createdAt: true, user: { select: { name: true, fotoProfil: true } } } });
  return requests.map((request) => ({ id: request.id, userId: request.userId, name: request.user.name, photo: request.user.fotoProfil, createdAt: request.createdAt }));
}

export async function getJoinRequestStatus(groupId: number, userId: number) {
  const request = await prisma.groupJoinRequest.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { status: true } });
  return request?.status ?? null;
}


export async function searchPotentialMembers(groupId: number, query: string) {
  if (!query.trim()) return [];
  const members = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
  const users = await prisma.user.findMany({ where: { id: { notIn: members.map((member) => member.userId) }, isActive: true, OR: [{ name: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] }, take: 10, select: { id: true, name: true, fotoProfil: true } });
  return users.map((user) => ({ id: user.id, name: user.name, photo: user.fotoProfil }));
}

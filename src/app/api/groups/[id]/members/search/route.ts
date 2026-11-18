import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const groupId = Number((await params).id);
  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: user.id } }, select: { role: true } });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const existing = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: user.id, recipient: { isActive: true } },
        { recipientId: user.id, requester: { isActive: true } },
      ],
    },
    select: {
      requesterId: true,
      recipientId: true,
      requester: { select: { id: true, name: true, fotoProfil: true } },
      recipient: { select: { id: true, name: true, fotoProfil: true } },
    },
  });
  const friendIds = friendRequests.map((request) => request.requesterId === user.id ? request.recipientId : request.requesterId);
  const users = await prisma.user.findMany({ where: { isActive: true, id: { in: friendIds, notIn: existing.map((item) => item.userId) }, OR: [{ name: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] }, take: 20, select: { id: true, name: true, fotoProfil: true } });
  const friendIdSet = new Set(friendIds);
  const friendUsers = users.filter((item) => friendIdSet.has(item.id));
  return NextResponse.json({ users: friendUsers.map((item) => ({ id: item.id, name: item.name, photo: item.fotoProfil })) });
}

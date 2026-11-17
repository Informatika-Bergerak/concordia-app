import { NextResponse } from "next/server";
import { getDisplayName } from "@/lib/users/display-name";
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
  const users = await prisma.user.findMany({ where: { isActive: true, id: { notIn: existing.map((item) => item.userId) }, OR: [{ name: { contains: query, mode: "insensitive" } }, { nickname: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] }, take: 20, select: { id: true, name: true, nickname: true, fotoProfil: true } });
  return NextResponse.json({ users: users.map((item) => ({ id: item.id, name: getDisplayName(item.nickname, item.name), photo: item.fotoProfil })) });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getDisplayName } from "@/lib/users/display-name";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 40) ?? "";
  const users = await prisma.user.findMany({
    where: {
      id: { not: viewer.id },
      isActive: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { nickname: { contains: query, mode: "insensitive" as const } },
              { username: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ nickname: "asc" }, { name: "asc" }],
    take: 8,
    select: { id: true, name: true, nickname: true, username: true, fotoProfil: true },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: getDisplayName(user.nickname, user.name),
      username: user.username,
      photo: user.fotoProfil,
    })),
  });
}

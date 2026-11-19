import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { subscribeToGroup } from "@/lib/realtime/group-events";

export const runtime = "nodejs";

type GroupSnapshot = {
  updatedAt: number;
  memberCount: number;
  memberRoles: string;
  messageId: number | null;
  messageUpdatedAt: number | null;
};

async function getSnapshot(groupId: number): Promise<GroupSnapshot | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      updatedAt: true,
      _count: { select: { members: true } },
      members: { select: { userId: true, role: true } },
      messages: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, updatedAt: true },
      },
    },
  });
  if (!group) return null;
  return {
    updatedAt: group.updatedAt.getTime(),
    memberCount: group._count.members,
    memberRoles: JSON.stringify(group.members),
    messageId: group.messages[0]?.id ?? null,
    messageUpdatedAt: group.messages[0]?.updatedAt.getTime() ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const groupId = Number((await params).id);
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
    select: { id: true },
  });
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let previous = await getSnapshot(groupId);
      let checking = false;
      let timer: ReturnType<typeof setInterval> | undefined;
      let unsubscribe: (() => void) | undefined;
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({ type: "connected" });
      unsubscribe = subscribeToGroup(groupId, send);
      timer = setInterval(async () => {
        if (checking) return;
        checking = true;
        try {
          const current = await getSnapshot(groupId);
          if (JSON.stringify(current) !== JSON.stringify(previous)) {
            previous = current;
            send({ type: "group.updated" });
          }
        } finally {
          checking = false;
        }
      }, 1500);

      _request.signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        unsubscribe?.();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

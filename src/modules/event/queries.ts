import { prisma } from "@/lib/db";
import type { EventItem, EventStatus } from "./types";

function dateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapEvent(event: {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  location: string;
  isOnline: boolean;
  groupId: number | null;
  group: { name: string } | null;
  groupName: string | null;
  category: string;
  coverImage: string | null;
  status: EventStatus;
  creatorId: number;
  createdAt: Date;
  creator: { name: string; fotoProfil: string | null; jurusan: string | null };
  participants: { userId: number; user: { id: number; name: string; fotoProfil: string | null } }[];
  interests: { userId: number }[];
}): EventItem {
  return {
    id: String(event.id),
    title: event.title,
    description: event.description,
    startDate: dateString(event.startDate),
    startTime: event.startTime,
    endDate: dateString(event.endDate),
    endTime: event.endTime,
    location: event.location,
    isOnline: event.isOnline,
    groupId: event.groupId,
    groupName: event.group?.name ?? event.groupName,
    category: event.category,
    coverImage: event.coverImage,
    creatorId: event.creatorId,
    creatorName: event.creator.name,
    creatorFoto: event.creator.fotoProfil,
    creatorJurusan: event.creator.jurusan,
    createdAt: event.createdAt.toISOString(),
    status: event.status,
    participants: event.participants.map((item) => item.userId),
    participantUsers: event.participants.map((item) => item.user),
    interested: event.interests.map((item) => item.userId),
  };
}

export async function getJoinedGroups(userId: number) {
  return prisma.groupMember.findMany({
    where: { userId },
    orderBy: { group: { name: "asc" } },
    select: { group: { select: { id: true, name: true } } },
  }).then((items) => items.map((item) => item.group));
}

export async function getEvents(userId: number): Promise<EventItem[]> {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { groupId: null },
        { group: { members: { some: { userId } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true, fotoProfil: true, jurusan: true } },
      group: { select: { name: true } },
      participants: { select: { userId: true, user: { select: { id: true, name: true, fotoProfil: true } } } },
      interests: { select: { userId: true } },
    },
  });
  return events.map(mapEvent);
}

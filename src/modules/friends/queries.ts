import "server-only";

import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { FriendPerson } from "./types";
import { getDisplayName } from "@/lib/users/display-name";

const personSelect = {
  id: true,
  username: true,
  name: true,
  nickname: true,
  role: true,
  userType: true,
  jurusan: true,
  fotoProfil: true,
} as const;

type PersonRow = {
  id: number;
  username: string;
  name: string;
  nickname: string | null;
  role: FriendPerson["role"];
  userType: FriendPerson["userType"];
  jurusan: string | null;
  fotoProfil: string | null;
};

function mapPerson(person: PersonRow, relation: FriendPerson["relation"]): FriendPerson {
  return { ...person, name: getDisplayName(person.nickname, person.name), relation };
}

function relationFor(
  currentUserId: number,
  personId: number,
  requests: { requesterId: number; recipientId: number; status: "PENDING" | "ACCEPTED" | "REJECTED" }[],
): FriendPerson["relation"] {
  const request = requests.find(
    (item) =>
      (item.requesterId === currentUserId && item.recipientId === personId) ||
      (item.requesterId === personId && item.recipientId === currentUserId),
  );
  if (!request) return "NONE";
  if (request.status === "ACCEPTED") return "FRIENDS";
  if (request.status === "PENDING") {
    return request.requesterId === currentUserId ? "PENDING_SENT" : "PENDING_RECEIVED";
  }
  return "NONE";
}

export async function searchPeople(query: string): Promise<FriendPerson[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const normalized = query.trim().slice(0, 80);
  if (!normalized) return [];

  const people = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: user.id },
      OR: [
        { username: { contains: normalized, mode: "insensitive" } },
        { name: { contains: normalized, mode: "insensitive" } },
        { nickname: { contains: normalized, mode: "insensitive" } },
        { jurusan: { contains: normalized, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 50,
    select: personSelect,
  });

  if (people.length === 0) return [];
  const ids = people.map((person) => person.id);
  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { requesterId: user.id, recipientId: { in: ids } },
        { recipientId: user.id, requesterId: { in: ids } },
      ],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    select: { requesterId: true, recipientId: true, status: true },
  });

  return people.map((person) => mapPerson(person, relationFor(user.id, person.id, requests)));
}

export async function getSuggestedPeople(limit = 6): Promise<FriendPerson[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const existingRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [{ requesterId: user.id }, { recipientId: user.id }],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    select: { requesterId: true, recipientId: true },
  });
  const excludedIds = existingRequests.map((request) => request.requesterId === user.id ? request.recipientId : request.requesterId);

  const people = await prisma.user.findMany({
    where: { role: "USER", isActive: true, id: { notIn: [user.id, ...excludedIds] } },
    orderBy: [{ nickname: "asc" }, { name: "asc" }],
    take: Math.min(Math.max(limit, 1), 10),
    select: personSelect,
  });

  return people.map((person) => mapPerson(person, "NONE"));
}

export async function getRecentPeople(limit = 3): Promise<FriendPerson[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const people = await prisma.user.findMany({
    where: { isActive: true, id: { not: user.id } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 10),
    select: personSelect,
  });

  if (people.length === 0) return [];
  const ids = people.map((person) => person.id);
  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { requesterId: user.id, recipientId: { in: ids } },
        { recipientId: user.id, requesterId: { in: ids } },
      ],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    select: { requesterId: true, recipientId: true, status: true },
  });

  return people.map((person) => mapPerson(person, relationFor(user.id, person.id, requests)));
}

export async function getFriendLists() {
  const user = await getCurrentUser();
  if (!user) return { friends: [], incoming: [], outgoing: [] };

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [{ requesterId: user.id }, { recipientId: user.id }],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      requesterId: true,
      recipientId: true,
      status: true,
      requester: { select: personSelect },
      recipient: { select: personSelect },
    },
  });

  const friends: FriendPerson[] = [];
  const incoming: (FriendPerson & { requestId: number })[] = [];
  const outgoing: (FriendPerson & { requestId: number })[] = [];

  for (const request of requests) {
    const person = request.requesterId === user.id ? request.recipient : request.requester;
    if (request.status === "ACCEPTED") friends.push(mapPerson(person, "FRIENDS"));
    else if (request.recipientId === user.id) incoming.push({ ...mapPerson(person, "PENDING_RECEIVED"), requestId: request.id });
    else outgoing.push({ ...mapPerson(person, "PENDING_SENT"), requestId: request.id });
  }

  return { friends, incoming, outgoing };
}

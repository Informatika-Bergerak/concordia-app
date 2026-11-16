import type { Role, UserType } from "@/generated/prisma/enums";

export type FriendRelation = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";

export type FriendPerson = {
  id: number;
  username: string;
  name: string;
  role: Role;
  userType: UserType | null;
  jurusan: string | null;
  fotoProfil: string | null;
  relation: FriendRelation;
};

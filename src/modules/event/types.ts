export type EventStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  location: string;
  isOnline: boolean;
  groupId?: number | null;
  groupName?: string | null;
  category: string;
  coverImage: string | null;
  creatorId: number;
  creatorName: string;
  creatorFoto: string | null;
  creatorJurusan: string | null;
  createdAt: string;
  status: EventStatus;
  participants: number[]; // user IDs
  participantUsers?: { id: number; name: string; fotoProfil: string | null }[];
  interested: number[]; // user IDs
};

export type GroupListItem = {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  createdAt: Date;
  memberCount: number;
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: Date;
  } | null;
};

export type GroupDetail = {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  creatorId: number;
  creatorName: string;
  memberCount: number;
};


export type GroupMemberListItem = {
  id: number;
  userId: number;
  name: string;
  role: string;
  photo: string | null;
  joinedAt: Date;
};

export type GroupChatMessage = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  senderId: number;
  senderName: string;
};


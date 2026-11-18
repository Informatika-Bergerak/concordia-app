import type { Role, UserType } from "@/generated/prisma/enums";

export type FeedMention = {
  userId: number;
  name: string;
  username: string;
};

export type FeedComment = {
  id: string;
  parentId: string | null;
  authorId: number;
  authorName: string;
  authorRole?: Role;
  authorType?: UserType | null;
  timeAgo: string;
  text: string;
  mentions: FeedMention[];
  replies: FeedComment[];
};

export type FeedPost = {
  id: string;
  authorId: number;
  authorName: string;
  authorRole?: Role;
  authorType?: UserType | null;
  authorMajor: string;
  timeAgo: string;
  text: string;
  hashtags: string[];
  mentions: FeedMention[];
  location?: { label: string; url?: string; latitude?: number; longitude?: number };
  event?: { title: string; date: string; time: string; location: string; url?: string };
  poll?: { id: string; question: string; options: { id: string; text: string; votes: number }[]; viewerOptionId?: string };
  hasImage: boolean;
  imageUrl?: string;
  audioUrl?: string;
  likes: number;
  likedByViewer?: boolean;
  commentCount: number;
  comments: FeedComment[];
};

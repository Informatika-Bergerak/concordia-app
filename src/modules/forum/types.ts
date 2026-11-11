import type { Role, UserType } from "@/generated/prisma/enums";

export type FeedComment = {
  id: string;
  authorName: string;
  authorRole?: Role;
  authorType?: UserType | null;
  timeAgo: string;
  text: string;
};

export type FeedPost = {
  id: string;
  authorName: string;
  authorRole?: Role;
  authorType?: UserType | null;
  authorMajor: string;
  timeAgo: string;
  text: string;
  tag?: string;
  hasImage: boolean;
  likes: number;
  commentCount: number;
  comments: FeedComment[];
};
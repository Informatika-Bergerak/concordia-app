import "server-only";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { FeedPost } from "./types";

function timeAgo(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

function mapPost(post: {
  id: number;
  text: string;
  createdAt: Date;
  author: { name: string; role: FeedPost["authorRole"]; userType: FeedPost["authorType"]; jurusan: string | null };
  images: { url: string }[];
  audios: { url: string }[];
  _count: { likes: number; comments: number };
  likes: { id: number }[];
  comments: {
    id: number;
    text: string;
    createdAt: Date;
    author: { name: string; role: FeedPost["authorRole"]; userType: FeedPost["authorType"] };
  }[];
}): FeedPost {
  return {
    id: String(post.id),
    authorName: post.author.name,
    authorRole: post.author.role,
    authorType: post.author.userType,
    authorMajor: post.author.jurusan ?? "ConCordia",
    timeAgo: timeAgo(post.createdAt),
    text: post.text,
    hasImage: post.images.length > 0,
    imageUrl: post.images[0]?.url,
    audioUrl: post.audios[0]?.url,
    likes: post._count.likes,
    likedByViewer: post.likes.length > 0,
    commentCount: post._count.comments,
    comments: post.comments.map((comment) => ({
      id: String(comment.id),
      authorName: comment.author.name,
      authorRole: comment.author.role,
      authorType: comment.author.userType,
      timeAgo: timeAgo(comment.createdAt),
      text: comment.text,
    })),
  };
}

const postSelect = {
  id: true,
  text: true,
  createdAt: true,
  author: { select: { name: true, role: true, userType: true, jurusan: true } },
  images: { select: { url: true }, orderBy: { id: "asc" as const }, take: 1 },
  audios: { select: { url: true }, orderBy: { id: "asc" as const }, take: 1 },
  _count: { select: { likes: true, comments: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    take: 20,
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: { name: true, role: true, userType: true } },
    },
  },
} as const;

export async function getFeed(): Promise<FeedPost[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await prisma.forumPost.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      ...postSelect,
      likes: { where: { userId: user.id }, select: { id: true }, take: 1 },
    },
  });

  return rows.map(mapPost);
}

export async function searchPosts(query: string): Promise<FeedPost[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const normalized = query.trim().slice(0, 80);
  if (!normalized) return [];

  const rows = await prisma.forumPost.findMany({
    where: { text: { contains: normalized, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      ...postSelect,
      likes: { where: { userId: user.id }, select: { id: true }, take: 1 },
    },
  });

  return rows.map(mapPost);
}

export async function getLikedPosts(): Promise<FeedPost[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await prisma.forumPost.findMany({
    where: { likes: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      ...postSelect,
      likes: { where: { userId: user.id }, select: { id: true }, take: 1 },
    },
  });

  return rows.map(mapPost);
}

export async function getPostById(postId: number): Promise<FeedPost | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: {
      ...postSelect,
      likes: { where: { userId: user.id }, select: { id: true }, take: 1 },
    },
  });

  return post ? mapPost(post) : null;
}

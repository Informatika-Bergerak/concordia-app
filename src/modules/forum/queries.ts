import "server-only";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { FeedPost } from "./types";
import { getDisplayName } from "@/lib/users/display-name";
import { normalizeHashtagQuery, parseHashtags } from "@/lib/forum/hashtags";

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

type CommentRow = {
  id: number;
  parentId: number | null;
  authorId: number;
  text: string;
  createdAt: Date;
  author: { name: string; nickname: string | null; role: FeedPost["authorRole"]; userType: FeedPost["authorType"] };
  mentions: { userId: number; user: { name: string; nickname: string | null; username: string } }[];
};

function mapComment(comment: CommentRow): FeedPost["comments"][number] {
  return {
    id: String(comment.id),
    parentId: comment.parentId === null ? null : String(comment.parentId),
    authorId: comment.authorId,
    authorName: getDisplayName(comment.author.nickname, comment.author.name),
    authorRole: comment.author.role,
    authorType: comment.author.userType,
    timeAgo: timeAgo(comment.createdAt),
    text: comment.text,
    mentions: comment.mentions.map((mention) => ({
      userId: mention.userId,
      name: getDisplayName(mention.user.nickname, mention.user.name),
      username: mention.user.username,
    })),
    replies: [],
  };
}

function mapPost(post: {
  id: number;
  text: string;
  mentions: { userId: number; user: { name: string; nickname: string | null; username: string } }[];
  locationLabel: string | null;
  locationUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  eventTitle: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  eventUrl: string | null;
  poll: { id: number; question: string; options: { id: number; text: string; _count: { votes: number } }[] } | null;
  createdAt: Date;
  authorId: number;
  author: { name: string; nickname: string | null; role: FeedPost["authorRole"]; userType: FeedPost["authorType"]; jurusan: string | null };
  images: { url: string }[];
  audios: { url: string }[];
  _count: { likes: number; comments: number };
  likes: { id: number }[];
  comments: CommentRow[];
}): FeedPost {
  return {
    id: String(post.id),
    authorId: post.authorId,
    authorName: getDisplayName(post.author.nickname, post.author.name),
    authorRole: post.author.role,
    authorType: post.author.userType,
    authorMajor: post.author.jurusan ?? "ConCordia",
    timeAgo: timeAgo(post.createdAt),
    text: post.text,
    hashtags: parseHashtags(post.text).map((hashtag) => hashtag.value),
    mentions: post.mentions.map((mention) => ({
      userId: mention.userId,
      name: getDisplayName(mention.user.nickname, mention.user.name),
      username: mention.user.username,
    })),
    location: post.locationLabel ? { label: post.locationLabel, url: post.locationUrl ?? undefined, latitude: post.latitude ?? undefined, longitude: post.longitude ?? undefined } : undefined,
    event: post.eventTitle ? { title: post.eventTitle, date: post.eventDate ?? "", time: post.eventTime ?? "", location: post.eventLocation ?? "", url: post.eventUrl ?? undefined } : undefined,
    poll: post.poll ? { id: String(post.poll.id), question: post.poll.question, options: post.poll.options.map((option) => ({ id: String(option.id), text: option.text, votes: option._count.votes })) } : undefined,
    hasImage: post.images.length > 0,
    imageUrl: post.images[0]?.url,
    audioUrl: post.audios[0]?.url,
    likes: post._count.likes,
    likedByViewer: post.likes.length > 0,
    commentCount: post._count.comments,
    comments: (() => {
      const mapped = post.comments.map(mapComment);
      const byId = new Map(mapped.map((comment) => [comment.id, comment]));
      const roots: typeof mapped = [];
      for (const comment of mapped) {
        if (comment.parentId) {
          byId.get(comment.parentId)?.replies.push(comment);
        } else {
          roots.push(comment);
        }
      }
      return roots;
    })(),
  };
}

const postSelect = {
  id: true,
  text: true,
  mentions: {
    select: {
      userId: true,
      user: { select: { name: true, nickname: true, username: true } },
    },
    orderBy: { id: "asc" as const },
  },
  locationLabel: true,
  locationUrl: true,
  latitude: true,
  longitude: true,
  eventTitle: true,
  eventDate: true,
  eventTime: true,
  eventLocation: true,
  eventUrl: true,
  poll: {
    select: {
      id: true,
      question: true,
      options: {
        select: { id: true, text: true, _count: { select: { votes: true } } },
        orderBy: { id: "asc" as const },
      },
    },
  },
  createdAt: true,
  authorId: true,
  author: { select: { name: true, nickname: true, role: true, userType: true, jurusan: true } },
  images: { select: { url: true }, orderBy: { id: "asc" as const }, take: 1 },
  audios: { select: { url: true }, orderBy: { id: "asc" as const }, take: 1 },
  _count: { select: { likes: true, comments: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    take: 20,
    select: {
      id: true,
      parentId: true,
      authorId: true,
      text: true,
      createdAt: true,
      author: { select: { name: true, nickname: true, role: true, userType: true } },
      mentions: {
        select: {
          userId: true,
          user: { select: { name: true, nickname: true, username: true } },
        },
      },
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

  const hashtag = normalizeHashtagQuery(normalized);
  const rows = await prisma.forumPost.findMany({
    where: hashtag
      ? { text: { contains: `#${hashtag}`, mode: "insensitive" } }
      : { text: { contains: normalized, mode: "insensitive" } },
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

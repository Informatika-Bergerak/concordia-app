"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { FeedComment } from "./types";
import { commentIdSchema, createCommentSchema, createPostSchema, postIdSchema } from "./schemas";
import { getDisplayName } from "@/lib/users/display-name";

export type ForumActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function createPostAction(input: unknown): Promise<ForumActionResult<{ id: number }>> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Postingan tidak valid" };

  const { text, mentionUserIds, image, audio, location, latitude, longitude, event, poll } = parsed.data;
  const uniqueMentionIds = [...new Set(mentionUserIds)];
  const mentionedUsers = uniqueMentionIds.length
    ? await prisma.user.findMany({ where: { id: { in: uniqueMentionIds, not: user.id }, isActive: true }, select: { id: true } })
    : [];
  if (mentionedUsers.length !== uniqueMentionIds.length) return { ok: false, error: "Pengguna yang ditag tidak valid" };

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  for (const media of [image, audio]) {
    if (media && cloud && !media.url.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
      return { ok: false, error: "Media postingan tidak valid" };
    }
  }

  // Hanya simpan kolom yang dimiliki model forum. `resourceType` adalah
  // metadata respons upload dan tidak termasuk kolom ForumPostImage/Audio.
  const imageData = image
    ? {
        url: image.url,
        publicId: image.publicId,
        format: image.format,
        bytes: image.bytes,
        width: image.width,
        height: image.height,
      }
    : undefined;
  const audioData = audio
    ? {
        url: audio.url,
        publicId: audio.publicId,
        format: audio.format,
        bytes: audio.bytes,
      }
    : undefined;

  try {
    const post = await prisma.forumPost.create({
      data: {
        text,
        author: { connect: { id: user.id } },
        mentions: uniqueMentionIds.length ? { create: uniqueMentionIds.map((userId) => ({ userId })) } : undefined,
        locationLabel: location?.label || null,
        locationUrl: location?.url || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        eventTitle: event?.title || null,
        eventDate: event?.date || null,
        eventTime: event?.time || null,
        eventLocation: event?.location || null,
        eventUrl: event?.url || null,
        images: imageData ? { create: imageData } : undefined,
        audios: audioData ? { create: audioData } : undefined,
        poll: poll ? { create: { question: poll.question, options: { create: poll.options.map((text) => ({ text })) } } } : undefined,
      },
      select: { id: true },
    });
    revalidatePath("/beranda");
    return { ok: true, id: post.id };
  } catch (error) {
    console.error("[forum] Gagal membuat postingan:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan postingan, coba lagi" };
  }
}

export async function deletePostAction(input: unknown): Promise<ForumActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = postIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Postingan tidak valid" };
  const post = await prisma.forumPost.findUnique({ where: { id: parsed.data.postId }, select: { id: true, authorId: true } });
  if (!post) return { ok: false, error: "Postingan tidak ditemukan" };
  const allowed = post.authorId === user.id || user.role === "MODERATOR" || user.role === "ADMIN";
  if (!allowed) return { ok: false, error: "Anda tidak memiliki izin menghapus postingan ini" };
  try {
    await prisma.forumPost.delete({ where: { id: post.id } });
    revalidatePath("/beranda");
    revalidatePath("/search");
    revalidatePath("/disukai");
    return { ok: true };
  } catch (error) {
    console.error("[forum] Gagal menghapus postingan:", (error as Error).message);
    return { ok: false, error: "Gagal menghapus postingan, coba lagi" };
  }
}

export async function togglePostLikeAction(input: unknown): Promise<ForumActionResult<{ liked: boolean; count: number }>> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = postIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Postingan tidak valid" };
  const { postId } = parsed.data;

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return { ok: false, error: "Postingan tidak ditemukan" };

  const existing = await prisma.forumPostLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.forumPostLike.delete({ where: { id: existing.id } });
  } else {
    try {
      await prisma.forumPostLike.create({ data: { postId, userId: user.id } });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") {
        console.error("[forum] Gagal memberi like:", (error as Error).message);
        return { ok: false, error: "Gagal memperbarui like, coba lagi" };
      }
    }
  }

  const count = await prisma.forumPostLike.count({ where: { postId } });
  revalidatePath("/beranda");
  return { ok: true, liked: !existing, count };
}

export async function deleteCommentAction(input: unknown): Promise<ForumActionResult> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = commentIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Komentar tidak valid" };

  const comment = await prisma.forumComment.findUnique({
    where: { id: parsed.data.commentId },
    select: { id: true, authorId: true, postId: true },
  });
  if (!comment) return { ok: false, error: "Komentar tidak ditemukan" };

  const allowed = comment.authorId === user.id || user.role === "MODERATOR" || user.role === "ADMIN";
  if (!allowed) return { ok: false, error: "Anda tidak memiliki izin menghapus komentar ini" };

  try {
    await prisma.forumComment.delete({ where: { id: comment.id } });
    revalidatePath("/beranda");
    revalidatePath("/search");
    revalidatePath("/disukai");
    return { ok: true };
  } catch (error) {
    console.error("[forum] Gagal menghapus komentar:", (error as Error).message);
    return { ok: false, error: "Gagal menghapus komentar, coba lagi" };
  }
}

export async function createCommentAction(
  input: unknown,
): Promise<ForumActionResult<{ id: number; count: number; comment: FeedComment }>> {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Komentar tidak valid" };
  const { postId, text, parentId, mentionUserIds } = parsed.data;

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return { ok: false, error: "Postingan tidak ditemukan" };

  if (parentId) {
    const parent = await prisma.forumComment.findUnique({ where: { id: parentId }, select: { id: true, postId: true } });
    if (!parent || parent.postId !== postId) return { ok: false, error: "Komentar induk tidak valid" };
  }

  const uniqueMentionIds = [...new Set(mentionUserIds)];
  const mentionedUsers = uniqueMentionIds.length
    ? await prisma.user.findMany({ where: { id: { in: uniqueMentionIds, not: user.id }, isActive: true }, select: { id: true } })
    : [];
  if (mentionedUsers.length !== uniqueMentionIds.length) return { ok: false, error: "Pengguna yang ditag tidak valid" };

  try {
    const [comment, count] = await prisma.$transaction([
      prisma.forumComment.create({
        data: {
          postId,
          authorId: user.id,
          parentId: parentId ?? null,
          text,
          mentions: uniqueMentionIds.length ? { create: uniqueMentionIds.map((userId) => ({ userId })) } : undefined,
        },
        select: {
          id: true,
          parentId: true,
          text: true,
          createdAt: true,
          author: { select: { name: true, nickname: true, role: true, userType: true } },
          mentions: { select: { userId: true, user: { select: { name: true, nickname: true, username: true } } } },
        },
      }),
      prisma.forumComment.count({ where: { postId } }),
    ]);
    const seconds = Math.max(0, Math.floor((Date.now() - comment.createdAt.getTime()) / 1000));
    const timeAgo = seconds < 60
      ? "baru saja"
      : seconds < 3600
        ? `${Math.floor(seconds / 60)} menit yang lalu`
        : seconds < 86400
          ? `${Math.floor(seconds / 3600)} jam yang lalu`
          : `${Math.floor(seconds / 86400)} hari yang lalu`;
    revalidatePath("/beranda");
    return {
      ok: true,
      id: comment.id,
      count,
      comment: {
        id: String(comment.id),
        parentId: comment.parentId === null ? null : String(comment.parentId),
        authorId: user.id,
        authorName: getDisplayName(comment.author.nickname, comment.author.name),
        authorRole: comment.author.role,
        authorType: comment.author.userType,
        timeAgo,
        text: comment.text,
        mentions: comment.mentions.map((mention) => ({
          userId: mention.userId,
          name: getDisplayName(mention.user.nickname, mention.user.name),
          username: mention.user.username,
        })),
        replies: [],
      },
    };
  } catch (error) {
    console.error("[forum] Gagal membuat komentar:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan komentar, coba lagi" };
  }
}

import { z } from "zod";

const mediaFields = z.object({
  url: z.string().url(),
  publicId: z.string().regex(/^concordia\/forum\/[A-Za-z0-9-]+$/, "Media postingan tidak valid"),
  format: z.string().max(20).optional(),
  bytes: z.number().int().positive().max(10 * 1024 * 1024).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const imageSchema = mediaFields.refine(
  (media) => media.url.includes(media.publicId),
  "Media postingan tidak valid",
);

const audioFields = mediaFields.omit({ width: true, height: true });
const audioSchema = audioFields.refine(
  (media) => media.url.includes(media.publicId),
  "Media postingan tidak valid",
);

export const createPostSchema = z.object({
  text: z.string().trim().min(1, "Tulis sesuatu sebelum mengirim postingan.").max(2000),
  image: imageSchema.nullish(),
  audio: audioSchema.nullish(),
});

export const forumImageSchema = imageSchema;
export const forumAudioSchema = audioSchema;

export const postIdSchema = z.object({ postId: z.number().int().positive() });

export const createCommentSchema = postIdSchema.extend({
  text: z.string().trim().min(1, "Komentar tidak boleh kosong.").max(500),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

import { z } from "zod";

const mediaFields = z.object({
  url: z.string().url(),
  publicId: z.string().regex(/^concordia\/forum\/[A-Za-z0-9-]+$/, "Media postingan tidak valid"),
  format: z.string().max(20).optional(),
  bytes: z.number().int().positive().max(10 * 1024 * 1024).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const postAttachmentSchema = z.object({
  label: z.string().trim().max(120),
  url: z.string().url().max(500).optional(),
}).strict();

const pollSchema = z.object({
  question: z.string().trim().min(1).max(180),
  options: z.array(z.string().trim().min(1).max(80)).min(2).max(4),
}).strict();

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
  mentionUserIds: z.array(z.number().int().positive()).max(10).default([]),
  image: imageSchema.nullish(),
  audio: audioSchema.nullish(),
  location: postAttachmentSchema.nullish(),
  latitude: z.number().finite().min(-90).max(90).nullish(),
  longitude: z.number().finite().min(-180).max(180).nullish(),
  event: z.object({
    title: z.string().trim().min(1).max(160),
    date: z.string().trim().max(30),
    time: z.string().trim().max(30),
    location: z.string().trim().max(160),
    url: z.string().url().max(500).optional(),
  }).strict().nullish(),
  poll: pollSchema.nullish(),
}).strict().superRefine((value, ctx) => {
  if ((value.latitude === null) !== (value.longitude === null)) {
    ctx.addIssue({ code: "custom", path: ["location"], message: "Koordinat lokasi harus lengkap." });
  }
  if (value.poll) {
    const options = value.poll.options.map((option) => option.toLowerCase());
    if (new Set(options).size !== options.length) {
      ctx.addIssue({ code: "custom", path: ["poll", "options"], message: "Pilihan polling tidak boleh sama." });
    }
  }
});

export const forumImageSchema = imageSchema;
export const forumAudioSchema = audioSchema;

export const postIdSchema = z.object({ postId: z.number().int().positive() });
export const commentIdSchema = z.object({ commentId: z.number().int().positive() });

export const createCommentSchema = postIdSchema.extend({
  text: z.string().trim().min(1, "Komentar tidak boleh kosong.").max(500),
  parentId: z.number().int().positive().nullable().optional(),
  mentionUserIds: z.array(z.number().int().positive()).max(10).default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

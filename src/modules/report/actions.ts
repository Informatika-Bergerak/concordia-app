"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { canChangeStatus, requiresNote } from "./rules";
import { createReportInputSchema, updateReportStatusSchema } from "./schemas";

export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

// Membuat laporan baru. Mahasiswa, dosen, dan moderator boleh melapor; admin tidak.
export async function createReportAction(input: unknown): Promise<ActionResult<{ id: number }>> {
  const { user } = await requireRole(["USER", "MODERATOR"]);

  const parsed = createReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { photo, occurredAt, ...data } = parsed.data;

  // Bila nama cloud dikonfigurasi, foto harus berasal dari akun Cloudinary kita.
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (photo && cloud && !photo.url.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
    return { ok: false, error: "Foto tidak valid" };
  }

  try {
    const report = await prisma.report.create({
      data: {
        ...data,
        occurredAt: new Date(`${occurredAt}T00:00:00.000Z`),
        authorId: user.id,
        photos: photo
          ? {
              create: {
                url: photo.url,
                publicId: photo.publicId,
                format: photo.format,
                bytes: photo.bytes,
                width: photo.width,
                height: photo.height,
              },
            }
          : undefined,
        history: {
          create: { fromStatus: null, toStatus: "UNVERIFIED", changedById: user.id },
        },
      },
      select: { id: true },
    });

    revalidatePath("/laporan");
    return { ok: true, id: report.id };
  } catch (error) {
    console.error("[report] Gagal membuat laporan:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan laporan, coba lagi" };
  }
}

// Mengubah status laporan. Hanya admin yang boleh memverifikasi atau menolak.
export async function updateReportStatusAction(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole(["ADMIN"]);

  const parsed = updateReportStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const { reportId, status, note } = parsed.data;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) return { ok: false, error: "Laporan tidak ditemukan" };
  if (!canChangeStatus(report.status, status)) {
    return { ok: false, error: "Status laporan sudah sama" };
  }

  const reason = requiresNote(status) ? note : undefined;

  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { status, rejectionReason: reason ?? null },
    }),
    prisma.reportStatusHistory.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus: status,
        note: note ?? null,
        changedById: user.id,
      },
    }),
  ]);

  revalidatePath("/laporan");
  return { ok: true };
}

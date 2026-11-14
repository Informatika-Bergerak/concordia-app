"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { canChangeStatus, requiresNote, supportBlockReason } from "./rules";
import {
  createReportInputSchema,
  supportReportSchema,
  updateReportStatusSchema,
} from "./schemas";

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

// Mendukung ("Bantu Laporan") atau mencabut dukungan. Satu pengguna satu dukungan per laporan.
export async function toggleSupportAction(
  input: unknown,
): Promise<ActionResult<{ supported: boolean; count: number }>> {
  const { user } = await requireRole(["USER", "MODERATOR"]);

  const parsed = supportReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Laporan tidak valid" };
  const { reportId } = parsed.data;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { authorId: true, visibility: true, status: true },
  });
  if (!report) return { ok: false, error: "Laporan tidak ditemukan" };

  const existing = await prisma.reportSupport.findUnique({
    where: { reportId_userId: { reportId, userId: user.id } },
    select: { id: true },
  });

  let supported: boolean;
  if (existing) {
    // Mencabut dukungan selalu boleh, walaupun laporan sudah ditolak atau menjadi Private.
    await prisma.reportSupport.deleteMany({ where: { reportId, userId: user.id } });
    supported = false;
  } else {
    const blocked = supportBlockReason(user.role, {
      isOwn: report.authorId === user.id,
      visibility: report.visibility,
      status: report.status,
    });
    if (blocked) return { ok: false, error: blocked };

    try {
      await prisma.reportSupport.create({ data: { reportId, userId: user.id } });
    } catch (error) {
      // Klik ganda: dukungan sudah tersimpan oleh permintaan lain (pelanggaran kunci unik).
      if ((error as { code?: string }).code !== "P2002") {
        console.error("[report] Gagal menyimpan dukungan:", (error as Error).message);
        return { ok: false, error: "Gagal menyimpan dukungan, coba lagi" };
      }
    }
    supported = true;
  }

  const count = await prisma.reportSupport.count({ where: { reportId } });

  revalidatePath("/laporan");
  revalidatePath(`/laporan/${reportId}`);
  return { ok: true, supported, count };
}

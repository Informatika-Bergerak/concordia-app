"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { deleteAsset } from "@/lib/cloudinary/upload";
import { STATUS_LABELS } from "./constants";
import {
  allowedVisibilities,
  canChangeStatus,
  editBlockReason,
  requiresNote,
  supportBlockReason,
} from "./rules";
import { generateReportSlug } from "./slug";
import {
  createReportInputSchema,
  supportReportSchema,
  updateReportInputSchema,
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
export async function createReportAction(
  input: unknown,
): Promise<ActionResult<{ id: number; slug: string }>> {
  const { user } = await requireRole(["USER", "MODERATOR"]);

  const parsed = createReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { photo, occurredAt, groupId, ...data } = parsed.data;

  // Kategori Laporan Grup hanya dibuat dari halaman grup, yang menyertakan groupId.
  if (data.category === "LAPORAN_GRUP" && groupId === undefined) {
    return {
      ok: false,
      error: "Pilih kategori masalah",
      fieldErrors: { category: "Pilih kategori masalah" },
    };
  }
  // Laporan moderator harus Public (laporan grup tetap mengikuti aturannya sendiri).
  if (groupId === undefined && !allowedVisibilities(user.role).includes(data.visibility)) {
    return {
      ok: false,
      error: "Laporan moderator harus Public",
      fieldErrors: { visibility: "Laporan moderator harus Public" },
    };
  }

  let groupData: { groupId: number } | undefined;
  if (groupId !== undefined) {
    // Semua pengguna yang dapat membuat laporan boleh melaporkan grup,
    // termasuk pengguna yang bukan anggota grup tersebut.
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) return { ok: false, error: "Grup tidak ditemukan" };
    groupData = { groupId: group.id };
  }

  // Bila nama cloud dikonfigurasi, foto harus berasal dari akun Cloudinary kita.
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (photo && cloud && !photo.url.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
    return { ok: false, error: "Foto tidak valid" };
  }

  try {
    // Slug dibuat acak; bila kebetulan bentrok (kunci unik), coba lagi dengan akhiran baru.
    let report: { id: number; slug: string } | undefined;
    for (let attempt = 0; attempt < 3 && !report; attempt++) {
      try {
        report = await prisma.report.create({
          data: {
            ...data,
            ...groupData,
            slug: generateReportSlug(data.title),
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
          select: { id: true, slug: true },
        });
      } catch (error) {
        if ((error as { code?: string }).code !== "P2002") throw error;
      }
    }
    if (!report) throw new Error("Slug unik tidak dapat dibuat");

    revalidatePath("/laporan");
    return { ok: true, id: report.id, slug: report.slug };
  } catch (error) {
    console.error("[report] Gagal membuat laporan:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan laporan, coba lagi" };
  }
}

// Mengubah status laporan sepanjang tahap verifikasi dan penanganan. Hanya admin.
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
    select: { id: true, slug: true, status: true },
  });
  if (!report) return { ok: false, error: "Laporan tidak ditemukan" };
  if (report.status === status) return { ok: false, error: "Status laporan sudah sama" };
  if (!canChangeStatus(report.status, status)) {
    return {
      ok: false,
      error: `Status tidak dapat diubah dari "${STATUS_LABELS[report.status]}" ke "${STATUS_LABELS[status]}"`,
    };
  }

  const reason = requiresNote(status) ? note : undefined;

  try {
    await prisma.$transaction(async (tx) => {
      // Pembaruan bersyarat pada status yang tadi dibaca: bila admin lain sudah mengubahnya,
      // perubahan ini dibatalkan agar tidak saling menimpa.
      const { count } = await tx.report.updateMany({
        where: { id: reportId, status: report.status },
        data: { status, rejectionReason: reason ?? null },
      });
      if (count === 0) throw new Error("STATUS_CHANGED");

      await tx.reportStatusHistory.create({
        data: {
          reportId,
          fromStatus: report.status,
          toStatus: status,
          note: note ?? null,
          changedById: user.id,
        },
      });
    });
  } catch (error) {
    if ((error as Error).message === "STATUS_CHANGED") {
      return { ok: false, error: "Status laporan sudah diubah pihak lain, muat ulang halaman" };
    }
    console.error("[report] Gagal mengubah status:", (error as Error).message);
    return { ok: false, error: "Gagal mengubah status, coba lagi" };
  }

  revalidatePath("/laporan");
  revalidatePath(`/laporan/${report.slug}`);
  revalidatePath("/admin/laporan");
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
    select: { slug: true, authorId: true, visibility: true, status: true },
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
  revalidatePath(`/laporan/${report.slug}`);
  return { ok: true, supported, count };
}

// Mengubah laporan milik sendiri selama masih Belum Terverifikasi.
export async function updateReportAction(
  input: unknown,
): Promise<ActionResult<{ id: number; slug: string }>> {
  const { user } = await requireRole(["USER", "MODERATOR"]);

  const parsed = updateReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const { reportId, photo, occurredAt, ...data } = parsed.data;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      slug: true,
      authorId: true,
      groupId: true,
      status: true,
      photos: { select: { publicId: true } },
    },
  });
  if (!report) return { ok: false, error: "Laporan tidak ditemukan" };

  const blocked = editBlockReason(user.role, {
    isOwn: report.authorId === user.id,
    status: report.status,
  });
  if (blocked) return { ok: false, error: blocked };

  if (report.groupId === null && !allowedVisibilities(user.role).includes(data.visibility)) {
    return {
      ok: false,
      error: "Laporan moderator harus Public",
      fieldErrors: { visibility: "Laporan moderator harus Public" },
    };
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (photo && cloud && !photo.url.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
    return { ok: false, error: "Foto tidak valid" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Pembaruan bersyarat: hanya berhasil bila laporan masih Belum Terverifikasi. Ini
      // mencegah perubahan yang masuk tepat setelah admin memverifikasi atau menolak.
      const { count } = await tx.report.updateMany({
        where: { id: reportId, status: "UNVERIFIED" },
        data: { ...data, occurredAt: new Date(`${occurredAt}T00:00:00.000Z`) },
      });
      if (count === 0) throw new Error("STATUS_CHANGED");

      // photo === undefined: foto tidak diubah. null: dihapus. objek: diganti.
      if (photo !== undefined) {
        await tx.reportPhoto.deleteMany({ where: { reportId } });
        if (photo) {
          await tx.reportPhoto.create({
            data: {
              reportId,
              url: photo.url,
              publicId: photo.publicId,
              format: photo.format,
              bytes: photo.bytes,
              width: photo.width,
              height: photo.height,
            },
          });
        }
      }
    });
  } catch (error) {
    if ((error as Error).message === "STATUS_CHANGED") {
      return { ok: false, error: "Status laporan sudah berubah, muat ulang halaman" };
    }
    console.error("[report] Gagal memperbarui laporan:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan perubahan, coba lagi" };
  }

  // Hapus berkas lama di Cloudinary setelah database berhasil diperbarui (upaya terbaik).
  if (photo !== undefined) {
    for (const old of report.photos) {
      if (old.publicId === photo?.publicId) continue;
      try {
        await deleteAsset(old.publicId);
      } catch (error) {
        console.error("[report] Gagal menghapus foto lama:", (error as Error).message);
      }
    }
  }

  revalidatePath("/laporan");
  revalidatePath(`/laporan/${report.slug}`);
  revalidatePath("/admin/laporan");
  return { ok: true, id: reportId, slug: report.slug };
}

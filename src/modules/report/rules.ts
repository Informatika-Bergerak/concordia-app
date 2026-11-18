import { getDisplayName } from "@/lib/users/display-name";
import type {
  AdminReportItem,
  ReportDetail,
  ReportItem,
  ReportStatus,
  ReportVisibility,
} from "./types";

// Aturan murni (tanpa akses database) supaya mudah diuji.

export type ViewerRole = "USER" | "MODERATOR" | "ADMIN";

/** Hanya mahasiswa, dosen, dan moderator yang membuat laporan; admin hanya memverifikasi. */
export function canCreateReport(role: ViewerRole): boolean {
  return role !== "ADMIN";
}

/** Bentuk baris dari Prisma yang dibutuhkan untuk membuat ReportItem. */
export type ReportRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  location: string;
  category: ReportItem["category"];
  status: ReportStatus;
  visibility: ReportVisibility;
  occurredAt: Date;
  authorId: number;
  author: { name: string; nickname?: string | null };
  photos: { url: string }[];
  /** Jumlah dukungan, dari `_count: { select: { supports: true } }` */
  _count?: { supports: number };
  /** Dukungan milik pengguna yang melihat (difilter pada query) */
  supports?: { userId: number }[];
};

/**
- Mengubah baris database menjadi data yang aman dikirim ke browser.
- Nama pelapor hanya disertakan untuk laporan PUBLIC. Untuk ANONYMOUS dan
- PRIVATE nama dibuang di sini, sebelum data keluar dari server.
 */
export function toReportItem(row: ReportRow, viewerId: number): ReportItem {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status,
    visibility: row.visibility,
    occurredAt: row.occurredAt.toISOString().slice(0, 10),
    coverImage: row.photos[0]?.url ?? null,
    authorName: row.visibility === "PUBLIC" ? getDisplayName(row.author.nickname, row.author.name) : null,
    isMine: row.authorId === viewerId,
    supportCount: row._count?.supports ?? 0,
    supportedByMe: (row.supports?.length ?? 0) > 0,
  };
}

/** Laporan PRIVATE hanya boleh dilihat pelapor dan admin. */
export function canViewReport(
  viewer: { id: number; role: ViewerRole },
  report: { visibility: ReportVisibility; authorId: number },
): boolean {
  if (report.visibility !== "PRIVATE") return true;
  return viewer.role === "ADMIN" || report.authorId === viewer.id;
}

/**
 * Perpindahan status yang diizinkan, dari tahap verifikasi sampai penanganan selesai:
 * Belum Terverifikasi -> Terverifikasi -> Diproses -> Selesai.
 * Disertakan jalur koreksi bagi admin: membatalkan Diproses, membuka kembali laporan Selesai,
 * dan meninjau ulang laporan yang ditolak.
 */
const NEXT_STATUSES: Record<ReportStatus, ReportStatus[]> = {
  UNVERIFIED: ["VERIFIED", "REJECTED"],
  VERIFIED: ["IN_PROGRESS", "RESOLVED", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "VERIFIED"],
  RESOLVED: ["IN_PROGRESS"],
  REJECTED: ["UNVERIFIED"],
};

/** Status yang dapat dipilih admin sebagai langkah berikutnya dari status saat ini. */
export function allowedNextStatuses(from: ReportStatus): ReportStatus[] {
  return NEXT_STATUSES[from];
}

export function canChangeStatus(from: ReportStatus, to: ReportStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}

/**
 * Visibilitas yang boleh dipilih untuk laporan biasa. Laporan moderator selalu Public
 * agar pelapornya dapat dipertanggungjawabkan. Laporan grup memakai aturan tersendiri.
 */
export function allowedVisibilities(role: ViewerRole): ReportVisibility[] {
  return role === "MODERATOR" ? ["PUBLIC"] : ["PUBLIC", "ANONYMOUS", "PRIVATE"];
}

/**
- Alasan sebuah laporan tidak dapat didukung oleh pengguna ini, atau null bila boleh.
- Dipakai server (menolak aksi) dan tampilan (menyembunyikan tombol) agar aturannya sama.
- Berlaku untuk menambah dukungan; mencabut dukungan selalu diizinkan.
 */
export function supportBlockReason(
  role: ViewerRole,
  report: { isOwn: boolean; visibility: ReportVisibility; status: ReportStatus },
): string | null {
  if (role === "ADMIN") return "Admin tidak mendukung laporan";
  if (report.isOwn) return "Tidak dapat mendukung laporan sendiri";
  if (report.visibility === "PRIVATE") return "Laporan Private tidak dapat didukung";
  if (report.status === "REJECTED") return "Laporan yang ditolak tidak dapat didukung";
  if (report.status === "RESOLVED") return "Laporan yang sudah selesai tidak dapat didukung";
  return null;
}

/**
<<<<<<< Updated upstream
 * Alasan laporan tidak dapat diubah oleh pengguna ini, atau null bila boleh.
 * Hanya pelapor yang mengubah laporannya (admin tidak), dan hanya selama laporan masih
 * Belum Terverifikasi. Setelah diverifikasi, diproses, selesai, atau ditolak, isinya dikunci.
=======
- Alasan laporan tidak dapat diubah oleh pengguna ini, atau null bila boleh.
- Hanya pelapor yang mengubah laporannya (admin tidak), dan hanya selama laporan masih
- Belum Terverifikasi. Setelah diverifikasi atau ditolak, isinya dikunci.
>>>>>>> Stashed changes
 */
export function editBlockReason(
  role: ViewerRole,
  report: { isOwn: boolean; status: ReportStatus },
): string | null {
  if (role === "ADMIN") return "Admin tidak mengubah laporan";
  if (!report.isOwn) return "Hanya pelapor yang dapat mengubah laporan";
  if (report.status === "REJECTED") return "Laporan yang ditolak tidak dapat diubah";
  if (report.status !== "UNVERIFIED") return "Laporan yang sudah terverifikasi atau diproses tidak dapat diubah";
  return null;
}

/** Penolakan wajib disertai alasan agar pelapor tahu penyebabnya. */
export function requiresNote(to: ReportStatus): boolean {
  return to === "REJECTED";
}

export type ReportDetailRow = ReportRow & {
  rejectionReason: string | null;
  photos: { url: string }[];
  history: {
    fromStatus: ReportStatus | null;
    toStatus: ReportStatus;
    note: string | null;
    createdAt: Date;
  }[];
};

/**
- Detail laporan. Alasan penolakan dan riwayat status hanya dikirim ke pelapor
- dan admin; pengguna lain hanya melihat isi laporan.
 */
export function toReportDetail(
  row: ReportDetailRow,
  viewer: { id: number; role: ViewerRole },
): ReportDetail {
  const base = toReportItem(row, viewer.id);
  const privileged = base.isMine || viewer.role === "ADMIN";
  return {
    ...base,
    photos: row.photos.map((p) => p.url),
    rejectionReason: privileged ? row.rejectionReason : null,
    history: privileged
      ? row.history.map((h) => ({
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        }))
      : [],
  };
}

export type AdminReportRow = Omit<ReportRow, "author"> & {
  rejectionReason: string | null;
  createdAt: Date;
  author: { name: string; nickname?: string | null; username: string; userType: "MAHASISWA" | "DOSEN" | null };
  author: {
    name: string;
    username: string;
    userType: "MAHASISWA" | "DOSEN" | null;
    role: ViewerRole;
  };
};

/** Khusus admin: identitas pelapor selalu disertakan dan laporan dosen ditandai. */
export function toAdminReportItem(row: AdminReportRow, viewerId: number): AdminReportItem {
  return {
    ...toReportItem(row, viewerId),
    authorName: getDisplayName(row.author.nickname, row.author.name),
    authorUsername: row.author.username,
    fromLecturer: row.author.userType === "DOSEN",
    fromModerator: row.author.role === "MODERATOR",
    createdAt: row.createdAt.toISOString(),
    rejectionReason: row.rejectionReason,
  };
}
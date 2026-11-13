import type {
  AdminReportItem,
  ReportDetail,
  ReportItem,
  ReportStatus,
  ReportVisibility,
} from "./types";

// Aturan murni (tanpa akses database) supaya mudah diuji.

/** Bentuk baris dari Prisma yang dibutuhkan untuk membuat ReportItem. */
export type ReportRow = {
  id: number;
  title: string;
  description: string;
  location: string;
  category: ReportItem["category"];
  status: ReportStatus;
  visibility: ReportVisibility;
  occurredAt: Date;
  authorId: number;
  author: { name: string };
  photos: { url: string }[];
};

/**
 * Mengubah baris database menjadi data yang aman dikirim ke browser.
 * Nama pelapor hanya disertakan untuk laporan PUBLIC. Untuk ANONYMOUS dan
 * PRIVATE nama dibuang di sini, sebelum data keluar dari server.
 */
export function toReportItem(row: ReportRow, viewerId: number): ReportItem {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status,
    visibility: row.visibility,
    occurredAt: row.occurredAt.toISOString().slice(0, 10),
    coverImage: row.photos[0]?.url ?? null,
    authorName: row.visibility === "PUBLIC" ? row.author.name : null,
    isMine: row.authorId === viewerId,
    supportCount: 0,
  };
}

/** Laporan PRIVATE hanya boleh dilihat pelapor dan admin. */
export function canViewReport(
  viewer: { id: number; role: "USER" | "MODERATOR" | "ADMIN" },
  report: { visibility: ReportVisibility; authorId: number },
): boolean {
  if (report.visibility !== "PRIVATE") return true;
  return viewer.role === "ADMIN" || report.authorId === viewer.id;
}

/** Status boleh berubah ke status lain, asalkan bukan status yang sama. */
export function canChangeStatus(from: ReportStatus, to: ReportStatus): boolean {
  return from !== to;
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
 * Detail laporan untuk pengguna biasa. Alasan penolakan dan riwayat status hanya
 * dikirim ke pelapor dan admin; pengguna lain hanya melihat isi laporan.
 */
export function toReportDetail(
  row: ReportDetailRow,
  viewer: { id: number; role: "USER" | "MODERATOR" | "ADMIN" },
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

export type AdminReportRow = ReportRow & {
  rejectionReason: string | null;
  createdAt: Date;
  author: { name: string; username: string };
};

/** Khusus admin: nama dan username pelapor selalu disertakan, termasuk laporan Anonymous. */
export function toAdminReportItem(row: AdminReportRow, viewerId: number): AdminReportItem {
  return {
    ...toReportItem(row, viewerId),
    authorName: row.author.name,
    authorUsername: row.author.username,
    createdAt: row.createdAt.toISOString(),
    rejectionReason: row.rejectionReason,
  };
}

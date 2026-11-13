import "server-only";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import {
  canViewReport,
  toAdminReportItem,
  toReportDetail,
  toReportItem,
} from "./rules";
import type { AdminReportItem, ReportDetail, ReportItem, ReportStatus } from "./types";

const listSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  category: true,
  status: true,
  visibility: true,
  occurredAt: true,
  authorId: true,
  photos: { select: { url: true }, orderBy: { id: "asc" as const }, take: 1 },
};

// Daftar untuk halaman /laporan: laporan milik pengguna sendiri ditambah laporan
// Public dan Anonymous milik orang lain. Laporan Private orang lain tidak diambil.
export async function getReports(): Promise<ReportItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await prisma.report.findMany({
    where: {
      OR: [{ visibility: { not: "PRIVATE" } }, { authorId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      category: true,
      status: true,
      visibility: true,
      occurredAt: true,
      authorId: true,
      author: { select: { name: true } },
      photos: { select: { url: true }, orderBy: { id: "asc" }, take: 1 },
    },
  });

  return rows.map((row) => toReportItem(row, user.id));
}

// Detail satu laporan. Mengembalikan null bila tidak ada atau tidak boleh dilihat,
// sehingga halaman cukup memanggil notFound() tanpa membocorkan keberadaan laporan Private.
export async function getReportById(id: number): Promise<ReportDetail | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const row = await prisma.report.findUnique({
    where: { id },
    select: {
      ...listSelect,
      rejectionReason: true,
      author: { select: { name: true } },
      photos: { select: { url: true }, orderBy: { id: "asc" } },
      history: {
        select: { fromStatus: true, toStatus: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!row || !canViewReport(user, row)) return null;

  return toReportDetail(row, user);
}

// Daftar untuk panel admin: semua laporan, termasuk Private, dengan identitas pelapor.
export async function getAdminReports(status?: ReportStatus): Promise<AdminReportItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return [];

  const rows = await prisma.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      ...listSelect,
      rejectionReason: true,
      createdAt: true,
      author: { select: { name: true, username: true } },
    },
  });

  return rows.map((row) => toAdminReportItem(row, user.id));
}

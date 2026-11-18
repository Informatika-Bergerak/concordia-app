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
import { getDisplayName } from "@/lib/users/display-name";

<<<<<<< Updated upstream
const listSelect = {
  id: true,
  slug: true,
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

// Jumlah dukungan dan apakah pengguna ini sudah mendukung.
=======
// Helper untuk dukungan (support)
>>>>>>> Stashed changes
const supportSelect = (userId: number) => ({
  _count: { select: { supports: true } },
  supports: { where: { userId }, select: { userId: true } },
});

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
      author: { select: { name: true, nickname: true } },
      photos: { select: { url: true }, orderBy: { id: "asc" }, take: 1 },
      ...listSelect,
      author: { select: { name: true } },
      ...supportSelect(user.id),
    },
  });

  return rows.map((row) => toReportItem(row, user.id));
}

// Detail satu laporan. Mengembalikan null bila tidak ada atau tidak boleh dilihat,
// sehingga halaman cukup memanggil notFound() tanpa membocorkan keberadaan laporan Private.
export async function getReportBySlug(slug: string): Promise<ReportDetail | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const row = await prisma.report.findUnique({
    where: { slug },
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
      rejectionReason: true,
      author: { select: { name: true, nickname: true } },
      photos: { select: { url: true }, orderBy: { id: "asc" } },
      history: {
        select: { fromStatus: true, toStatus: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      ...supportSelect(user.id),
    },
  });
  if (!row || !canViewReport(user, row)) return null;

  return toReportDetail(row, user);
}

// Mencari slug dari nomor laporan, untuk mengalihkan alamat lama (/laporan/4) ke alamat baru.
// Hanya mengembalikan slug bila laporan itu boleh dilihat pengguna.
export async function getReportSlugById(id: number): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const row = await prisma.report.findUnique({
    where: { id },
    select: { slug: true, visibility: true, authorId: true },
  });
  if (!row || !canViewReport(user, row)) return null;
  return row.slug;
}

// Daftar untuk panel verifikasi: hanya admin. Semua laporan termasuk Private, dengan
// identitas pelapor dan penanda laporan dari dosen dan moderator.
export async function getAdminReports(
  status?: ReportStatus,
  sort: "newest" | "support" = "newest",
): Promise<AdminReportItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return [];

  const rows = await prisma.report.findMany({
    where: status ? { status } : undefined,
    orderBy:
      sort === "support"
        ? [{ supports: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: 200,
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
      rejectionReason: true,
      createdAt: true,
      author: { select: { name: true, nickname: true, username: true, userType: true } },
<<<<<<< Updated upstream
      author: { select: { name: true, username: true, userType: true, role: true } },
      _count: { select: { supports: true } },
=======
      photos: { select: { url: true }, orderBy: { id: "asc" }, take: 1 },
      ...supportSelect(user.id),
>>>>>>> Stashed changes
    },
  });

  return rows.map((row) => toAdminReportItem(row, user.id));
}
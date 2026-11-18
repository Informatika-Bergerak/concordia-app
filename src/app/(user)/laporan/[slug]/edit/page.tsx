import { notFound, redirect } from "next/navigation";
import { ReportForm } from "@/components/report/report-form";
import { requireRole } from "@/lib/auth/guards";
import { getReportBySlug } from "@/modules/report/queries";
import { editBlockReason } from "@/modules/report/rules";

export default async function EditLaporanPage({ params }: { params: Promise<{ slug: string }> }) {
  // Admin tidak mengubah laporan, jadi hanya mahasiswa, dosen, dan moderator yang sampai sini.
  const { user } = await requireRole(["USER", "MODERATOR"]);
  const { slug } = await params;

  const report = await getReportBySlug(slug);
  if (!report) notFound();

  // Bukan laporan sendiri atau sudah diverifikasi/ditolak: kembali ke halaman detail.
  if (editBlockReason(user.role, { isOwn: report.isMine, status: report.status }) !== null) {
    redirect(`/laporan/${slug}`);
  }

  return (
    <ReportForm
      viewerRole={user.role}
      initial={{
        id: Number(report.id),
        slug,
        title: report.title,
        description: report.description,
        location: report.location,
        category: report.category,
        occurredAt: report.occurredAt,
        visibility: report.visibility,
        photoUrl: report.photos[0] ?? null,
      }}
    />
  );
}

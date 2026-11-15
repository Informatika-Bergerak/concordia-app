import { notFound, redirect } from "next/navigation";
import { ReportForm } from "@/components/report/report-form";
import { requireRole } from "@/lib/auth/guards";
import { getReportById } from "@/modules/report/queries";
import { editBlockReason } from "@/modules/report/rules";

export default async function EditLaporanPage({ params }: { params: Promise<{ id: string }> }) {
  // Admin tidak mengubah laporan, jadi hanya mahasiswa, dosen, dan moderator yang sampai sini.
  const { user } = await requireRole(["USER", "MODERATOR"]);
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) notFound();

  const report = await getReportById(reportId);
  if (!report) notFound();

  // Bukan laporan sendiri atau sudah terverifikasi: kembali ke halaman detail.
  if (editBlockReason(user.role, { isOwn: report.isMine, status: report.status }) !== null) {
    redirect(`/laporan/${reportId}`);
  }

  return (
    <ReportForm
      initial={{
        id: reportId,
        title: report.title,
        description: report.description,
        location: report.location,
        category: report.category,
        occurredAt: report.occurredAt,
        visibility: report.visibility,
        photoUrl: report.photos[0] ?? null,
        resubmit: report.status === "REJECTED",
      }}
    />
  );
}

import { notFound } from "next/navigation";
import { ReportDetail } from "@/components/report/report-detail";
import { requireRole } from "@/lib/auth/guards";
import { getReportById } from "@/modules/report/queries";

export default async function LaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) notFound();

  const report = await getReportById(reportId);
  if (!report) notFound();

  return <ReportDetail report={report} viewerRole={user.role} />;
}

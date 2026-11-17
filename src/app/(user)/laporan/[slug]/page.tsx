import { notFound, permanentRedirect } from "next/navigation";
import { ReportDetail } from "@/components/report/report-detail";
import { requireRole } from "@/lib/auth/guards";
import { getReportBySlug, getReportSlugById } from "@/modules/report/queries";
import { isNumericId } from "@/modules/report/slug";

export default async function LaporanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const { slug } = await params;

  // Alamat lama berbentuk nomor (/laporan/4) dialihkan ke alamat baru berbentuk slug.
  if (isNumericId(slug)) {
    const target = await getReportSlugById(Number(slug));
    if (!target) notFound();
    permanentRedirect(`/laporan/${target}`);
  }

  const report = await getReportBySlug(slug);
  if (!report) notFound();

  return <ReportDetail report={report} viewerRole={user.role} />;
}

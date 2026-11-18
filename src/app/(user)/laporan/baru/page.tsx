import { ReportForm } from "@/components/report/report-form";
import { requireRole } from "@/lib/auth/guards";

export default async function BuatLaporanPage() {
  // Admin hanya memverifikasi laporan, tidak membuatnya.
  const { user } = await requireRole(["USER", "MODERATOR"]);
  return <ReportForm viewerRole={user.role} />;
}

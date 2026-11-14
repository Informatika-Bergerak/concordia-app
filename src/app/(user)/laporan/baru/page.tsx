import { ReportForm } from "@/components/report/report-form";
import { requireRole } from "@/lib/auth/guards";

export default async function BuatLaporanPage() {
  // Admin hanya memverifikasi laporan, tidak membuatnya.
  await requireRole(["USER", "MODERATOR"]);
  return <ReportForm />;
}

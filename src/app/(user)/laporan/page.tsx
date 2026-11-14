import Link from "next/link";
import { AddReportFab } from "@/components/report/add-report-fab";
import { ReportFeed } from "@/components/report/report-feed";
import styles from "@/components/report/report.module.css";
import { requireRole } from "@/lib/auth/guards";
import { getReports } from "@/modules/report/queries";
import { canCreateReport } from "@/modules/report/rules";

export default async function LaporanPage() {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const reports = await getReports();
  const canCreate = canCreateReport(user.role);

  return (
    <>
      {!canCreate && (
        <p className={styles.notice}>
          Kamu masuk sebagai admin. Admin tidak membuat laporan; verifikasi laporan di{" "}
          <Link href="/admin/laporan" className={styles.noticeLink}>Panel Verifikasi</Link>.
        </p>
      )}
      <ReportFeed reports={reports} canCreate={canCreate} />
      {canCreate && <AddReportFab />}
    </>
  );
}

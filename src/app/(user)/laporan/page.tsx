import { AddReportFab } from "@/components/report/add-report-fab";
import { ReportFeed } from "@/components/report/report-feed";
import { getReports } from "@/modules/report/queries";

export default async function LaporanPage() {
  const reports = await getReports();

  return (
    <>
      <ReportFeed reports={reports} />
      <AddReportFab />
    </>
  );
}

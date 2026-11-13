import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ReviewForm } from "@/components/report/review-form";
import { StatusBadge } from "@/components/report/status-badge";
import styles from "@/components/report/report.module.css";
import { requireRole } from "@/lib/auth/guards";
import { CATEGORY_LABELS, STATUS_OPTIONS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDate } from "@/modules/report/format";
import { getAdminReports } from "@/modules/report/queries";
import type { ReportStatus } from "@/modules/report/types";

const VALID: ReportStatus[] = ["UNVERIFIED", "VERIFIED", "REJECTED"];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user: admin } = await requireRole(["ADMIN"]);
  const { status: raw } = await searchParams;
  const status = VALID.find((s) => s === raw);

  const reports = await getAdminReports(status);

  return (
    <AppShell user={admin}>
      <div className={styles.page} style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <div>
          <h1 className="page-title">Verifikasi Laporan</h1>
          <p className="page-sub">
            Tinjau laporan kampus, ubah statusnya, dan beri alasan bila laporan ditolak.
          </p>
        </div>

        <div className={styles.filters} role="group" aria-label="Filter status">
          <Link href="/admin/reports" className={styles.chip} aria-current={!status ? "page" : undefined}>Semua</Link>
          {STATUS_OPTIONS.map(([value, label]) => (
            <Link key={value} href={`/admin/reports?status=${value}`} className={styles.chip} aria-current={status === value ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>

        {reports.length === 0 ? (
          <p className={styles.empty}>Tidak ada laporan.</p>
        ) : (
          <div className={styles.adminList}>
            {reports.map((r) => (
              <article key={r.id} className={styles.adminItem}>
                <div className={styles.cardTop}>
                  <h2 className={styles.cardTitle}>
                    <Link href={`/laporan/${r.id}`} className={styles.cardLink}>{r.title}</Link>
                  </h2>
                  <StatusBadge status={r.status} />
                </div>
                <p className={styles.desc}>{r.description}</p>
                {r.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.adminThumb} src={r.coverImage} alt={`Foto laporan ${r.title}`} />
                )}
                <div className={styles.adminMeta}>
                  <span>{r.location}</span>
                  <span>{CATEGORY_LABELS[r.category]}</span>
                  <span>{formatReportDate(r.occurredAt)}</span>
                  <span>Pelapor: {r.authorName} (@{r.authorUsername})</span>
                  <span>
                    {r.visibility === "ANONYMOUS" ? (
                      <span className={styles.anonTag}>Anonymous ke publik</span>
                    ) : (
                      VISIBILITY_LABELS[r.visibility]
                    )}
                  </span>
                </div>
                {r.status === "REJECTED" && r.rejectionReason && (
                  <p className={styles.reason}><strong>Alasan:</strong> {r.rejectionReason}</p>
                )}
                <ReviewForm reportId={Number(r.id)} current={r.status} />
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

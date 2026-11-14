import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ReviewForm } from "@/components/report/review-form";
import { StatusBadge } from "@/components/report/status-badge";
import styles from "@/components/report/report.module.css";
import { requireRole } from "@/lib/auth/guards";
import { CATEGORY_LABELS, STATUS_OPTIONS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDate } from "@/modules/report/format";
import { getAdminReports } from "@/modules/report/queries";
import type { AdminReportItem, ReportStatus } from "@/modules/report/types";

const VALID: ReportStatus[] = ["UNVERIFIED", "VERIFIED", "REJECTED"];

function AdminReportCard({ r }: { r: AdminReportItem }) {
  return (
    <article className={`${styles.adminItem} ${r.fromLecturer ? styles.isLecturer : ""}`}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>
          <Link href={`/laporan/${r.id}`} className={styles.cardLink}>{r.title}</Link>
        </h3>
        <StatusBadge status={r.status} />
      </div>
      {r.fromLecturer && <span className={styles.lecturerTag}>Laporan dari dosen</span>}
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
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user: admin } = await requireRole(["ADMIN"]);
  const { status: raw } = await searchParams;
  const status = VALID.find((s) => s === raw);

  const reports = await getAdminReports(status);

  // Laporan dosen yang belum diverifikasi disorot di bagian atas.
  const highlighted =
    status && status !== "UNVERIFIED"
      ? []
      : reports.filter((r) => r.fromLecturer && r.status === "UNVERIFIED");
  const rest = reports.filter((r) => !highlighted.includes(r));
  const waiting = reports.filter((r) => r.status === "UNVERIFIED").length;

  return (
    <AppShell user={admin}>
      <div className={styles.page} style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <div>
          <h1 className="page-title">Verifikasi Laporan</h1>
          <p className="page-sub">
            Tinjau laporan kampus, ubah statusnya, dan beri alasan bila laporan ditolak.
          </p>
        </div>

        <div className={styles.summary}>
          <span className={styles.pill}>Ditampilkan: <strong>{reports.length}</strong></span>
          <span className={styles.pill}>Menunggu verifikasi: <strong>{waiting}</strong></span>
          {highlighted.length > 0 && (
            <span className={`${styles.pill} ${styles.pillAlert}`}>
              Dari dosen, menunggu: <strong>{highlighted.length}</strong>
            </span>
          )}
        </div>

        <div className={styles.filters} role="group" aria-label="Filter status">
          <Link href="/admin/laporan" className={styles.chip} aria-current={!status ? "page" : undefined}>Semua</Link>
          {STATUS_OPTIONS.map(([value, label]) => (
            <Link key={value} href={`/admin/laporan?status=${value}`} className={styles.chip} aria-current={status === value ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>

        {highlighted.length > 0 && (
          <section className={styles.highlightBox} aria-labelledby="sorotan-dosen">
            <h2 id="sorotan-dosen" className={styles.highlightHead}>
              Perlu perhatian: laporan dari dosen ({highlighted.length})
            </h2>
            <p className={styles.highlightHint}>Laporan dosen yang belum diverifikasi.</p>
            <div className={styles.adminList}>
              {highlighted.map((r) => <AdminReportCard key={r.id} r={r} />)}
            </div>
          </section>
        )}

        {reports.length === 0 ? (
          <p className={styles.empty}>Tidak ada laporan.</p>
        ) : (
          rest.length > 0 && (
            <div className={styles.adminList}>
              {rest.map((r) => <AdminReportCard key={r.id} r={r} />)}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}

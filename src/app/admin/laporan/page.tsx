import Link from "next/link";
import { CalendarDays, EyeOff, Globe, Lock, MapPin, ThumbsUp, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PhotoViewer } from "@/components/report/photo-viewer";
import { ReviewForm } from "@/components/report/review-form";
import { StatusBadge } from "@/components/report/status-badge";
import styles from "@/components/report/report.module.css";
import { requireRole } from "@/lib/auth/guards";
import { CATEGORY_LABELS, STATUS_OPTIONS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDate } from "@/modules/report/format";
import { getAdminReports } from "@/modules/report/queries";
import type { AdminReportItem, ReportStatus } from "@/modules/report/types";

const VALID: ReportStatus[] = ["UNVERIFIED", "VERIFIED", "REJECTED"];
const VISIBILITY_ICON = { PUBLIC: Globe, ANONYMOUS: EyeOff, PRIVATE: Lock } as const;

function AdminReportCard({ r }: { r: AdminReportItem }) {
  const VisibilityIcon = VISIBILITY_ICON[r.visibility];

  return (
    <article className={`${styles.adminItem} ${r.fromLecturer || r.fromModerator ? styles.isPriority : ""}`}>
      <header className={styles.adminHead}>
        <div className={styles.adminTitleBlock}>
          <div className={styles.adminTags}>
            <span className={styles.category}>{CATEGORY_LABELS[r.category]}</span>
            {r.fromLecturer && <span className={styles.lecturerTag}>Laporan dari dosen</span>}
            {r.fromModerator && <span className={styles.lecturerTag}>Laporan dari moderator</span>}
            {r.visibility === "ANONYMOUS" && <span className={styles.anonTag}>Anonymous ke publik</span>}
            {r.visibility === "PRIVATE" && <span className={styles.privTag}>Private</span>}
          </div>
          <h3 className={styles.adminTitle}>
            <Link href={`/laporan/${r.slug ?? r.id}`} className={styles.cardLink}>{r.title}</Link>
          </h3>
          <p className={styles.adminReporter}>
            <UserRound size={13} aria-hidden />
            Pelapor: <strong>{r.authorName}</strong> (@{r.authorUsername})
          </p>
        </div>
        <StatusBadge status={r.status} />
      </header>

      <div className={styles.adminBody}>
        <div className={styles.adminText}>
          <p className={styles.adminDesc}>{r.description}</p>

          {r.status === "REJECTED" && r.rejectionReason && (
            <p className={styles.reason}><strong>Alasan penolakan:</strong> {r.rejectionReason}</p>
          )}

          <dl className={styles.adminFacts}>
            <div className={styles.adminFact}>
              <dt><MapPin size={12} aria-hidden /> Lokasi</dt>
              <dd>{r.location}</dd>
            </div>
            <div className={styles.adminFact}>
              <dt><CalendarDays size={12} aria-hidden /> Tanggal kejadian</dt>
              <dd>{formatReportDate(r.occurredAt)}</dd>
            </div>
            <div className={styles.adminFact}>
              <dt><VisibilityIcon size={12} aria-hidden /> Visibilitas</dt>
              <dd>{VISIBILITY_LABELS[r.visibility]}</dd>
            </div>
            <div className={styles.adminFact}>
              <dt><ThumbsUp size={12} aria-hidden /> Dukungan</dt>
              <dd><strong>{r.supportCount}</strong></dd>
            </div>
          </dl>
        </div>

        {r.coverImage && (
          <PhotoViewer
            src={r.coverImage}
            alt={`Foto laporan ${r.title}`}
            className={styles.adminThumb}
            buttonClassName={styles.adminThumbBtn}
          />
        )}
      </div>

      <footer className={styles.adminReview}>
        <ReviewForm reportId={Number(r.id)} current={r.status} />
      </footer>
    </article>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const { user: admin } = await requireRole(["ADMIN"]);
  const { status: raw, sort: rawSort } = await searchParams;
  const status = VALID.find((s) => s === raw);
  const sort = rawSort === "support" ? "support" : "newest";

  const reports = await getAdminReports(status, sort);

  // Tautan filter dan urutan saling mempertahankan pilihan satu sama lain.
  const href = (nextStatus?: ReportStatus, nextSort = sort) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextSort === "support") params.set("sort", "support");
    const query = params.toString();
    return query ? `/admin/laporan?${query}` : "/admin/laporan";
  };

  // Laporan dosen dan moderator yang belum diverifikasi disorot di bagian atas.
  const highlighted =
    status && status !== "UNVERIFIED"
      ? []
      : reports.filter((r) => (r.fromLecturer || r.fromModerator) && r.status === "UNVERIFIED");
  const rest = reports.filter((r) => !highlighted.includes(r));
  const waiting = reports.filter((r) => r.status === "UNVERIFIED").length;

  return (
    <AppShell user={admin}>
      <div className={styles.adminPage}>
        <div>
          <h1 className="page-title">Verifikasi Laporan</h1>
          <p className="page-sub">
            Tinjau laporan kampus, ubah statusnya, dan beri alasan bila laporan ditolak.
          </p>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Ditampilkan</span>
            <span className={styles.statValue}>{reports.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Menunggu verifikasi</span>
            <span className={styles.statValue}>{waiting}</span>
          </div>
          {highlighted.length > 0 && (
            <div className={`${styles.stat} ${styles.statAlert}`}>
              <span className={styles.statLabel}>Dosen dan moderator, menunggu</span>
              <span className={styles.statValue}>{highlighted.length}</span>
            </div>
          )}
        </div>

        <div className={styles.adminToolbar}>
          <div className={styles.toolbarGroup} role="group" aria-label="Filter status">
            <span className={styles.toolbarLabel}>Status</span>
            <Link href={href(undefined)} className={styles.chip} aria-current={!status ? "page" : undefined}>Semua</Link>
            {STATUS_OPTIONS.map(([value, label]) => (
              <Link key={value} href={href(value)} className={styles.chip} aria-current={status === value ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </div>
          <div className={styles.toolbarGroup} role="group" aria-label="Urutan">
            <span className={styles.toolbarLabel}>Urutkan</span>
            <Link href={href(status, "newest")} className={styles.chip} aria-current={sort === "newest" ? "page" : undefined}>Terbaru</Link>
            <Link href={href(status, "support")} className={styles.chip} aria-current={sort === "support" ? "page" : undefined}>Dukungan terbanyak</Link>
          </div>
        </div>

        {highlighted.length > 0 && (
          <section className={styles.highlightBox} aria-labelledby="sorotan-dosen">
            <h2 id="sorotan-dosen" className={styles.highlightHead}>
              Perlu perhatian: laporan dari dosen dan moderator ({highlighted.length})
            </h2>
            <p className={styles.highlightHint}>Laporan dosen dan moderator yang belum diverifikasi.</p>
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

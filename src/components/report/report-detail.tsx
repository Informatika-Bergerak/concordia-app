import Link from "next/link";
import { CalendarDays, EyeOff, Globe, Info, Lock, MapPin, Pencil, UserRound } from "lucide-react";
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDate, formatReportDateTime } from "@/modules/report/format";
import { editBlockReason, supportBlockReason, type ViewerRole } from "@/modules/report/rules";
import type { ReportDetail as ReportDetailData } from "@/modules/report/types";
import { PhotoViewer } from "./photo-viewer";
import styles from "./report.module.css";
import { StatusBadge } from "./status-badge";
import { SupportButton } from "./support-button";

const VISIBILITY_ICON = { PUBLIC: Globe, ANONYMOUS: EyeOff, PRIVATE: Lock } as const;

export function ReportDetail({
  report,
  viewerRole,
}: {
  report: ReportDetailData;
  viewerRole: ViewerRole;
}) {
  const author = report.authorName ?? "Anonymous";
  const VisibilityIcon = VISIBILITY_ICON[report.visibility];

  const canSupport =
    supportBlockReason(viewerRole, {
      isOwn: report.isMine,
      visibility: report.visibility,
      status: report.status,
    }) === null;
  const canEdit =
    editBlockReason(viewerRole, { isOwn: report.isMine, status: report.status }) === null;

  return (
    <article className={styles.detail}>
      <header className={styles.detailHead}>
        <div className={styles.detailBadges}>
          <span className={styles.category}>{CATEGORY_LABELS[report.category]}</span>
          <StatusBadge status={report.status} />
        </div>
        <h2 className={styles.detailTitle}>{report.title}</h2>
      </header>

      {report.status === "REJECTED" && report.rejectionReason && (
        <p className={styles.reason}>
          <strong>Alasan penolakan:</strong> {report.rejectionReason}
        </p>
      )}

      <p className={styles.detailText}>{report.description}</p>

      {report.photos.length > 0 && (
        <div className={styles.gallery}>
          {report.photos.map((url) => (
            <PhotoViewer
              key={url}
              src={url}
              alt={`Foto laporan ${report.title}`}
              className={styles.photo}
            />
          ))}
        </div>
      )}

      <div className={styles.detailActions}>
        {canSupport ? (
          <SupportButton
            reportId={Number(report.id)}
            initialSupported={report.supportedByMe ?? false}
            initialCount={report.supportCount}
          />
        ) : (
          <p className={styles.supportCount}>{report.supportCount} dukungan</p>
        )}
      </div>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt className={styles.factLabel}><MapPin size={13} aria-hidden /> Lokasi</dt>
          <dd>{report.location}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}><CalendarDays size={13} aria-hidden /> Tanggal kejadian</dt>
          <dd>{formatReportDate(report.occurredAt)}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}><UserRound size={13} aria-hidden /> Dibuat oleh</dt>
          <dd>{author}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}><VisibilityIcon size={13} aria-hidden /> Visibilitas</dt>
          <dd>{VISIBILITY_LABELS[report.visibility]}</dd>
        </div>
      </dl>

      {report.history.length > 0 && (
        <section aria-labelledby="riwayat-status">
          <h3 id="riwayat-status" className={styles.subHead}>Riwayat Status</h3>
          <ol className={styles.timeline}>
            {report.history.map((h) => (
              <li key={h.createdAt + h.toStatus} className={styles.timelineItem}>
                <StatusBadge status={h.toStatus} />
                {h.note && <span className={styles.timelineNote}>{h.note}</span>}
                <span className={styles.timelineMeta}>{formatReportDateTime(h.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {canEdit && report.status === "REJECTED" && (
        <p className={styles.hint}>
          <Info size={16} aria-hidden />
          Perbaiki laporan lalu simpan untuk mengajukannya ulang.
        </p>
      )}

      <div className={styles.formActions}>
        <Link href="/laporan" className={styles.back}>Kembali</Link>
        {canEdit && (
          <Link href={`/laporan/${report.id}/edit`} className={styles.editBtn}>
            <Pencil size={14} aria-hidden /> Edit Laporan
          </Link>
        )}
      </div>
    </article>
  );
}

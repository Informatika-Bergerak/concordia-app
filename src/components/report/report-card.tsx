import Link from "next/link";
import { CalendarDays, EyeOff, Globe, Lock, MapPin, UserRound } from "lucide-react";
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDateShort } from "@/modules/report/format";
import type { ReportItem, ReportVisibility } from "@/modules/report/types";
import styles from "./report.module.css";
import { StatusBadge } from "./status-badge";

const VISIBILITY_ICON = { PUBLIC: Globe, ANONYMOUS: EyeOff, PRIVATE: Lock } as const;

export function ReportCard({ report }: { report: ReportItem }) {
  // Identitas pelapor hanya tampil bila laporan berstatus Public.
  const author =
    report.visibility === "PUBLIC" && report.authorName ? report.authorName : "Anonymous";
  const VisibilityIcon = VISIBILITY_ICON[report.visibility as ReportVisibility];

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.category}>{CATEGORY_LABELS[report.category]}</span>
        <StatusBadge status={report.status} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardText}>
          <h3 className={styles.cardTitle}>
            <Link href={`/laporan/${report.id}`} className={styles.cardLink}>
              {report.title}
            </Link>
          </h3>
          <p className={styles.desc}>{report.description}</p>
        </div>
        {report.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.thumb} src={report.coverImage} alt={`Foto laporan ${report.title}`} />
        )}
      </div>

      <div className={styles.cardFoot}>
        <dl className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <dt className={styles.srOnly}>Lokasi</dt>
            <dd><MapPin size={13} aria-hidden /><span className={styles.ellipsis}>{report.location}</span></dd>
          </div>
          <div className={`${styles.metaItem} ${styles.metaEnd}`}>
            <dt className={styles.srOnly}>Tanggal kejadian</dt>
            <dd><CalendarDays size={13} aria-hidden />{formatReportDateShort(report.occurredAt)}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.srOnly}>Dibuat oleh</dt>
            <dd><UserRound size={13} aria-hidden /><span className={styles.ellipsis}>{author}</span></dd>
          </div>
          <div className={`${styles.metaItem} ${styles.metaEnd}`}>
            <dt className={styles.srOnly}>Visibilitas</dt>
            <dd><VisibilityIcon size={13} aria-hidden />{VISIBILITY_LABELS[report.visibility]}</dd>
          </div>
        </dl>

        {!report.isMine && report.visibility !== "PRIVATE" && (
          <button type="button" className={styles.support} disabled title="Fitur dukungan menyusul">
            Bantu Laporan{report.supportCount > 0 ? ` (${report.supportCount})` : ""}
          </button>
        )}
      </div>
    </article>
  );
}

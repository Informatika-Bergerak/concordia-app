import Link from "next/link";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDate } from "@/modules/report/format";
import type { ReportItem } from "@/modules/report/types";
import styles from "./report.module.css";
import { StatusBadge } from "./status-badge";

export function ReportCard({ report }: { report: ReportItem }) {
  // Identitas pelapor hanya tampil bila laporan berstatus Public.
  const authorLabel =
    report.visibility === "PUBLIC" && report.authorName ? report.authorName : "Anonymous";

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>
          <Link href={`/laporan/${report.id}`} className={styles.cardLink}>
            {report.title}
          </Link>
        </h3>
        <div className={styles.badgeCol}>
          <StatusBadge status={report.status} />
          <span className={styles.visibility}>
            • {VISIBILITY_LABELS[report.visibility]}
          </span>
        </div>
      </div>

      <p className={styles.desc}>{report.description}</p>

      {report.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.cover} src={report.coverImage} alt={`Foto laporan ${report.title}`} />
      )}

      <hr className={styles.divider} />

      <div className={styles.meta}>
        <div className={styles.metaLeft}>
          <span className={styles.author}>
            <MapPin size={13} aria-hidden /> {report.location}
          </span>
          <span>• {CATEGORY_LABELS[report.category]}</span>
        </div>
        <div className={styles.metaRight}>
          <strong className={styles.author}>
            <CalendarDays size={13} aria-hidden />
            {formatReportDate(report.occurredAt)}
          </strong>
          <span className={styles.author}>
            Dibuat oleh {authorLabel} <UserRound size={13} aria-hidden />
          </span>
        </div>
      </div>

      {!report.isMine && report.visibility !== "PRIVATE" && (
        <button type="button" className={styles.support} disabled title="Fitur dukungan menyusul">
          Bantu Laporan{report.supportCount > 0 ? ` (${report.supportCount})` : ""}
        </button>
      )}
    </article>
  );
}

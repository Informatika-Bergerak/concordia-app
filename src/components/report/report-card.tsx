import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/modules/report/constants";
import type { ReportItem } from "@/modules/report/types";
import styles from "./report.module.css";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function ReportCard({ report }: { report: ReportItem }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>{report.title}</h3>
        <div className={styles.badgeCol}>
          <span className={`${styles.status} ${styles[`status${report.status}`]}`}>
            {STATUS_LABELS[report.status]}
          </span>
          <span className={styles.visibility}>
            • {report.visibility === "PUBLIC" ? "Public" : "Private"}
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
            {dateFormat.format(new Date(report.occurredAt))}
          </strong>
          <span className={styles.author}>
            Dibuat oleh {report.authorName ?? "Anonymous"} <UserRound size={13} aria-hidden />
          </span>
        </div>
      </div>

      {!report.isMine && report.visibility === "PUBLIC" && (
        <button type="button" className={styles.support} disabled title="Fitur dukungan menyusul">
          Bantu Laporan{report.supportCount > 0 ? ` (${report.supportCount})` : ""}
        </button>
      )}
    </article>
  );
}

import Link from "next/link";
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "@/modules/report/constants";
import { formatReportDate, formatReportDateTime } from "@/modules/report/format";
import type { ReportDetail as ReportDetailData } from "@/modules/report/types";
import styles from "./report.module.css";
import { StatusBadge } from "./status-badge";

export function ReportDetail({ report }: { report: ReportDetailData }) {
  const author = report.authorName ?? "Anonymous";

  return (
    <article className={styles.detail}>
      <div className={styles.detailTop}>
        <h2 className={styles.detailTitle}>{report.title}</h2>
        <StatusBadge status={report.status} />
      </div>

      {report.status === "REJECTED" && report.rejectionReason && (
        <p className={styles.reason}>
          <strong>Alasan penolakan:</strong> {report.rejectionReason}
        </p>
      )}

      <p className={styles.detailText}>{report.description}</p>

      {report.photos.length > 0 && (
        <div className={styles.gallery}>
          {report.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} className={styles.photo} src={url} alt={`Foto laporan ${report.title}`} />
          ))}
        </div>
      )}

      <dl className={styles.facts}>
        <div className={styles.fact}><dt className={styles.factLabel}>Lokasi</dt><dd>{report.location}</dd></div>
        <div className={styles.fact}><dt className={styles.factLabel}>Kategori</dt><dd>{CATEGORY_LABELS[report.category]}</dd></div>
        <div className={styles.fact}><dt className={styles.factLabel}>Tanggal kejadian</dt><dd>{formatReportDate(report.occurredAt)}</dd></div>
        <div className={styles.fact}><dt className={styles.factLabel}>Visibilitas</dt><dd>{VISIBILITY_LABELS[report.visibility]}</dd></div>
        <div className={styles.fact}><dt className={styles.factLabel}>Dibuat oleh</dt><dd>{author}</dd></div>
      </dl>

      {report.history.length > 0 && (
        <section aria-labelledby="riwayat-status">
          <h3 id="riwayat-status" className={styles.subHead}>Riwayat Status</h3>
          <ol className={styles.timeline}>
            {report.history.map((h) => (
              <li key={h.createdAt + h.toStatus} className={styles.timelineItem}>
                <StatusBadge status={h.toStatus} />
                {h.note && <span>{h.note}</span>}
                <span className={styles.timelineMeta}>{formatReportDateTime(h.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className={styles.formActions}>
        <Link href="/laporan" className={styles.back}>Kembali</Link>
      </div>
    </article>
  );
}

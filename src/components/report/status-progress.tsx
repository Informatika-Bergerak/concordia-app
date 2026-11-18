import { Check } from "lucide-react";
import { STATUS_FLOW, STATUS_LABELS } from "@/modules/report/constants";
import type { ReportStatus } from "@/modules/report/types";
import styles from "./report.module.css";

// Indikator tahap penanganan: Belum Terverifikasi, Terverifikasi, Diproses, Selesai.
// Laporan yang ditolak tidak mengikuti alur ini, jadi indikatornya disembunyikan.
export function StatusProgress({ status }: { status: ReportStatus }) {
  if (status === "REJECTED") return null;
  const current = STATUS_FLOW.indexOf(status);

  return (
    <ol className={styles.progress} aria-label="Tahap penanganan laporan">
      {STATUS_FLOW.map((step, index) => {
        const done = index < current || (status === "RESOLVED" && index === current);
        const state = done ? styles.stepDone : index === current ? styles.stepCurrent : "";
        return (
          <li
            key={step}
            className={`${styles.progressStep} ${state}`}
            aria-current={index === current ? "step" : undefined}
          >
            <span className={styles.stepDot}>
              {done ? <Check size={12} aria-hidden /> : index + 1}
            </span>
            <span className={styles.stepLabel}>{STATUS_LABELS[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}

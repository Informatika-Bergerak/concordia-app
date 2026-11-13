import { STATUS_LABELS } from "@/modules/report/constants";
import type { ReportStatus } from "@/modules/report/types";
import styles from "./report.module.css";

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`${styles.status} ${styles[`status${status}`]}`}>{STATUS_LABELS[status]}</span>
  );
}

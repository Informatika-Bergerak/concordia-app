"use client";

import type { EventItem } from "@/modules/event/types";
import { AlertTriangle } from "lucide-react";
import styles from "./event.module.css";

type ReportEventModalProps = {
  event: EventItem;
  currentUser: { id: number; name: string };
  onClose: () => void;
};

export function ReportEventModal({ event, currentUser, onClose }: ReportEventModalProps) {
  if (event.creatorId === currentUser.id) {
    return (
      <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className={styles.modalContent} style={{ maxWidth: "440px", textAlign: "center", padding: "30px" }}>
          <AlertTriangle size={48} color="#B80E0E" style={{ margin: "0 auto 16px" }} />
          <h2 id="report-title" className={styles.modalTitle} style={{ marginBottom: "12px" }}>Tidak Dapat Melaporkan Event Sendiri</h2>
          <p style={{ fontSize: "14px", color: "#5C0707", marginBottom: "20px" }}>
            Anda adalah pembuat event &ldquo;{event.title}&rdquo;. Anda tidak dapat melaporkan event milik sendiri.
          </p>
          <button type="button" className={styles.btnPrimary} onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
            Mengerti
          </button>
        </div>
      </div>
    );
  }

  return null;
}

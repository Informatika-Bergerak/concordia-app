"use client";

import { X } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type CancelEventModalProps = {
  event: EventItem;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelEventModal({ event, onClose, onConfirm }: CancelEventModalProps) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="cancel-title">
      <div className={styles.modalContent} style={{ maxWidth: "440px", textAlign: "center" }}>
        <div style={{ margin: "16px 0" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fef2f2", color: "#8A0B0B", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <X size={32} />
          </div>
          <h3 id="cancel-title" className={styles.modalTitle} style={{ fontSize: "20px" }}>Batalkan Event Anda?</h3>
          <p style={{ color: "#8A0B0B", fontSize: "14px", margin: "8px 0 24px" }}>
            Anda yakin ingin membatalkan event <strong>&ldquo;{event.title}&rdquo;</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} style={{ flex: 1 }}>
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: "#8A0B0B",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Batalkan Event
          </button>
        </div>
      </div>
    </div>
  );
}

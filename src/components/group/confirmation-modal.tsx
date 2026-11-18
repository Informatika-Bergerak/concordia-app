"use client";

import { X } from "lucide-react";
import styles from "./group.module.css";

export function GroupConfirmationModal({
  title,
  message,
  cancelLabel,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.confirmOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
      <div className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="group-confirm-title" aria-describedby="group-confirm-message">
        <button type="button" className={styles.confirmClose} aria-label="Tutup" onClick={onCancel} disabled={pending}><X size={18} /></button>
        <h2 id="group-confirm-title">{title}</h2>
        <p id="group-confirm-message">{message}</p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.confirmCancelBtn} onClick={onCancel} disabled={pending}>{cancelLabel}</button>
          <button type="button" className={styles.confirmPrimaryBtn} onClick={onConfirm} disabled={pending}>{pending ? "Memproses..." : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

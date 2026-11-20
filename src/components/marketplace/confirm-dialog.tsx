"use client";

import { useEffect, useId } from "react";
import styles from "./seller.module.css";

type Props = {
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ title, description, cancelLabel = "Kembali", confirmLabel, onCancel, onConfirm }: Props) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className={styles.dialogOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
        <h2 id={titleId}>{title}</h2>
        <p id={descId}>{description}</p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onCancel} autoFocus>{cancelLabel}</button>
          <button type="button" className={styles.dangerBtn} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

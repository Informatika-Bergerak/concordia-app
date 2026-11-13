"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateReportStatusAction } from "@/modules/report/actions";
import { STATUS_OPTIONS } from "@/modules/report/constants";
import type { ReportStatus } from "@/modules/report/types";
import styles from "./report.module.css";

export function ReviewForm({ reportId, current }: { reportId: number; current: ReportStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateReportStatusAction({ reportId, status, note: note || undefined });
      if (!result.ok) {
        setError(result.fieldErrors?.note ?? result.error);
        return;
      }
      setNote("");
      router.refresh();
    } catch {
      setError("Gagal memperbarui status, coba lagi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.reviewRow} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`status-${reportId}`}>Status</label>
        <select id={`status-${reportId}`} className={styles.select} value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`note-${reportId}`}>
          Catatan{status === "REJECTED" ? " (wajib untuk penolakan)" : ""}
        </label>
        <input id={`note-${reportId}`} className={`${styles.input} ${error ? styles.invalid : ""}`} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Alasan atau keterangan" />
      </div>
      <button type="submit" className={styles.submit} disabled={saving || status === current}>
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
      {error && <p className={styles.error} role="alert" style={{ flexBasis: "100%" }}>{error}</p>}
    </form>
  );
}

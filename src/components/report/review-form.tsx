"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateReportStatusAction } from "@/modules/report/actions";
import { STATUS_LABELS } from "@/modules/report/constants";
import { allowedNextStatuses } from "@/modules/report/rules";
import type { ReportStatus } from "@/modules/report/types";
import styles from "./report.module.css";

const NOTE_LABEL: Partial<Record<ReportStatus, string>> = {
  REJECTED: "Alasan penolakan (wajib)",
  IN_PROGRESS: "Keterangan penanganan (opsional)",
  RESOLVED: "Hasil penanganan (opsional)",
};

const NOTE_PLACEHOLDER: Partial<Record<ReportStatus, string>> = {
  REJECTED: "Mengapa laporan ini ditolak?",
  IN_PROGRESS: "Mis. sedang diperbaiki oleh tim fasilitas",
  RESOLVED: "Mis. lampu koridor sudah diganti",
};

export function ReviewForm({ reportId, current }: { reportId: number; current: ReportStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Status saat ini ditampilkan sebagai pilihan awal; sisanya hanya langkah yang diizinkan.
  const options = [current, ...allowedNextStatuses(current)];

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
        <label className={styles.label} htmlFor={`status-${reportId}`}>Ubah status</label>
        <select
          id={`status-${reportId}`}
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        >
          {options.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}{value === current ? " (saat ini)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`note-${reportId}`}>
          {NOTE_LABEL[status] ?? "Catatan (opsional)"}
        </label>
        <input
          id={`note-${reportId}`}
          className={`${styles.input} ${error ? styles.invalid : ""}`}
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder={NOTE_PLACEHOLDER[status] ?? "Alasan atau keterangan"}
        />
      </div>
      <button type="submit" className={styles.submit} disabled={saving || status === current}>
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </form>
  );
}

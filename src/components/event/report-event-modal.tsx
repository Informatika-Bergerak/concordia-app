"use client";

import { useState, type FormEvent } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import type { ReportItem } from "@/modules/report/types";
import styles from "./event.module.css";

type ReportEventModalProps = {
  event: EventItem;
  currentUser: { id: number; name: string };
  onClose: () => void;
  onSubmitReport: (successMsg: string) => void;
};

const REPORT_REASONS = [
  "Informasi event tidak benar",
  "Event mengandung konten tidak pantas",
  "Event merupakan spam",
  "Event terindikasi penipuan",
  "Event memiliki informasi yang menyesatkan",
  "Alasan lainnya",
];

export function ReportEventModal({ event, currentUser, onClose, onSubmitReport }: ReportEventModalProps) {
  // Prevent user from reporting their own event
  if (event.creatorId === currentUser.id) {
    return (
      <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className={styles.modalContent} style={{ maxWidth: "440px", textAlign: "center", padding: "30px" }}>
          <AlertTriangle size={48} color="#B80E0E" style={{ margin: "0 auto 16px" }} />
          <h2 id="report-title" className={styles.modalTitle} style={{ marginBottom: "12px" }}>Tidak Dapat Melaporkan Event Sendiri</h2>
          <p style={{ fontSize: "14px", color: "#5C0707", marginBottom: "20px" }}>
            Anda adalah pembuat event "{event.title}". Anda tidak dapat melaporkan event milik sendiri.
          </p>
          <button type="button" className={styles.btnPrimary} onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
            Mengerti
          </button>
        </div>
      </div>
    );
  }

  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedReason) return;

    // Save report to localStorage for integration with Laporan page
    const newReport: ReportItem = {
      id: `report_evt_${Date.now()}`,
      title: `Event: ${event.title}`,
      description: `Alasan: ${selectedReason}${description ? ` — ${description}` : ""}`,
      location: event.location || "Online / Kampus",
      category: "KEBIJAKAN",
      status: "UNVERIFIED",
      visibility: "PUBLIC",
      occurredAt: event.startDate,
      coverImage: event.coverImage,
      authorName: currentUser.name,
      isMine: true,
      supportCount: 0,
    };

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("concordia_reports_v1");
      let existing: ReportItem[] = [];
      if (saved) {
        try {
          existing = JSON.parse(saved);
        } catch {
          existing = [];
        }
      }
      localStorage.setItem("concordia_reports_v1", JSON.stringify([newReport, ...existing]));
    }

    onSubmitReport("Laporan event berhasil dikirim dan masuk ke halaman Laporan.");
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className={styles.modalContent} style={{ maxWidth: "540px" }}>
        <div className={styles.modalHeader}>
          <h2 id="report-title" className={styles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={20} color="#8A0B0B" /> Laporkan Event
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: "14px", color: "#5C0707", marginBottom: "16px" }}>
          Laporkan event <strong>"{event.title}"</strong> jika terdapat informasi atau aktivitas yang melanggar ketentuan Concordia.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Pilih Alasan Pelaporan</label>
            <div className={styles.radioGroup} style={{ gap: "8px" }}>
              {REPORT_REASONS.map((reason, idx) => (
                <label key={idx} className={styles.radioLabel} style={{ padding: "10px 14px", fontSize: "13px" }}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Penjelasan Tambahan (Opsional)</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Berikan detail atau kronologi tambahan jika diperlukan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: "80px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Kirim Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

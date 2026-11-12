"use client";

import { useState } from "react";
import { X, Trash, Calendar, AlertTriangle } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type DeleteEventModalProps = {
  event: EventItem;
  currentUserId: number;
  currentUserRole?: string;
  onClose: () => void;
  onConfirm: () => void;
  showToast: (msg: string) => void;
};

export function DeleteEventModal({
  event,
  currentUserId,
  currentUserRole,
  onClose,
  onConfirm,
  showToast,
}: DeleteEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate access rights: creator or admin/moderator
  const isAuthorized =
    event.creatorId === currentUserId ||
    currentUserRole === "ADMIN" ||
    currentUserRole === "MODERATOR";

  function handleDelete() {
    if (!isAuthorized) {
      setError("Anda tidak memiliki hak akses untuk menghapus event ini. Hanya pembuat event atau admin yang berwenang.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    // Simulate backend process and deletion
    setTimeout(() => {
      try {
        onConfirm();
      } catch (err) {
        setIsDeleting(false);
        setError("Gagal menghapus event. Silakan coba kembali.");
      }
    }, 500);
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-event-title">
      <div className={styles.modalContent} style={{ maxWidth: "480px" }}>
        <div className={styles.modalHeader}>
          <h2
            id="delete-event-title"
            className={styles.modalTitle}
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8A0B0B" }}
          >
            <Trash size={22} color="#8A0B0B" /> Hapus Event?
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Tutup"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        {!isAuthorized ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <AlertTriangle size={48} color="#B80E0E" style={{ margin: "0 auto 16px" }} />
            <h3 className={styles.emptyTitle}>Akses Ditolak</h3>
            <p style={{ fontSize: "14px", color: "#5C0707", marginBottom: "20px" }}>
              Anda bukan pembuat event ini atau admin yang berwenang. Penghapusan tidak diizinkan.
            </p>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Kembali
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "14px", color: "#5C0707", marginBottom: "16px", lineHeight: "1.5" }}>
              Apakah Anda yakin ingin menghapus event ini? Event yang dihapus tidak akan tersedia lagi di halaman Event Concordia.
            </p>

            {/* Event Info Preview */}
            <div
              style={{
                background: "#fff9f9",
                border: "1px solid #E49F9F",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "8px",
                  background: "#F4DBDB",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Calendar size={28} color="#8A0B0B" />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className={styles.badgeCategory} style={{ marginBottom: "4px" }}>
                  {event.category}
                </span>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#2E0404",
                    margin: "0 0 4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {event.title}
                </h4>
                <p style={{ fontSize: "12px", color: "#8A0B0B", margin: 0 }}>
                  {event.startDate} • {event.location}
                </p>
              </div>
            </div>

            {error && (
              <p
                style={{
                  color: "#B80E0E",
                  background: "#fef2f2",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onClose}
                disabled={isDeleting}
                style={{ flex: 1, justifyContent: "center" }}
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: "#8A0B0B",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: isDeleting ? 0.7 : 1,
                  transition: "background 150ms ease",
                }}
              >
                <Trash size={16} />
                {isDeleting ? "Menghapus..." : "Hapus Event"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

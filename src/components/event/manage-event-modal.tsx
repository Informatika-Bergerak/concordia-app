"use client";

import { useState } from "react";
import { X, Calendar, Settings, CalendarPlus, Edit3, Trash2, Trash, Share2, Heart } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type ManageEventModalProps = {
  events: EventItem[];
  currentUserId: number;
  onClose: () => void;
  onEdit: (event: EventItem) => void;
  onCancel: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onShare: (event: EventItem) => void;
  onToggleInterested: (event: EventItem) => void;
  showToast: (msg: string) => void;
};

export function ManageEventModal({
  events,
  currentUserId,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onShare,
  onToggleInterested,
  showToast,
}: ManageEventModalProps) {
  const myEvents = events.filter((e) => e.creatorId === currentUserId);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  function downloadIcs(event: EventItem) {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      `DTSTART:${event.startDate.replace(/-/g, "")}T${event.startTime.replace(":", "")}00Z`,
      `DTEND:${event.endDate.replace(/-/g, "")}T${event.endTime.replace(":", "")}00Z`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File kalendar .ics berhasil diunduh.");
    setActiveDropdownId(null);
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="manage-title">
      <div className={styles.modalContent} style={{ maxWidth: "720px" }}>
        <div className={styles.modalHeader}>
          <h2 id="manage-title" className={styles.modalTitle}>Event Anda</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        {myEvents.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: "40px 20px" }}>
            <Calendar size={48} color="#CD5656" style={{ margin: "0 auto" }} />
            <h3 className={styles.emptyTitle}>Belum ada event yang Anda buat</h3>
            <p className={styles.emptySub}>Buat event pertama Anda melalui tombol Buat Event di beranda.</p>
          </div>
        ) : (
          <div className={styles.manageCardList}>
            {myEvents.map((evt) => {
              const isInterested = evt.interested.includes(currentUserId);
              return (
                <div key={evt.id} className={styles.manageItemCard}>
                  <div className={styles.manageItemInfo}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className={styles.badgeCategory}>{evt.category}</span>
                      <span style={{ fontSize: "12px", color: "#8A0B0B", fontWeight: 600 }}>
                        {evt.status === "CANCELLED" ? "Dibatalkan" : evt.startDate}
                      </span>
                    </div>
                    <h4 className={styles.manageItemTitle}>{evt.title}</h4>
                    <p className={styles.manageItemSub}>{evt.location} • {evt.participants.length} Peserta</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => onShare(evt)}
                      title="Bagikan"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${isInterested ? styles.active : ""}`}
                      onClick={() => onToggleInterested(evt)}
                      title="Interested"
                    >
                      <Heart size={16} fill={isInterested ? "currentColor" : "none"} />
                    </button>

                    <div className={styles.dropdownContainer}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setActiveDropdownId(activeDropdownId === evt.id ? null : evt.id)}
                        aria-label="Pengaturan event"
                      >
                        <Settings size={18} />
                      </button>

                      {activeDropdownId === evt.id && (
                        <div className={styles.dropdownMenu}>
                          <button
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => downloadIcs(evt)}
                          >
                            <CalendarPlus size={15} /> Add to Calendar
                          </button>
                          <button
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              setActiveDropdownId(null);
                              onEdit(evt);
                            }}
                          >
                            <Edit3 size={15} /> Edit Event
                          </button>
                          <button
                            type="button"
                            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                            onClick={() => {
                              setActiveDropdownId(null);
                              onCancel(evt);
                            }}
                          >
                            <Trash2 size={15} /> Cancel Event
                          </button>
                          <button
                            type="button"
                            className={styles.dropdownItem}
                            style={{
                              color: "#8A0B0B",
                              borderTop: "1px solid #F4DBDB",
                              background: "#fff5f5",
                              fontWeight: 700,
                            }}
                            onClick={() => {
                              setActiveDropdownId(null);
                              onDelete(evt);
                            }}
                            title="Tindakan permanen"
                          >
                            <Trash size={15} color="#8A0B0B" /> Delete Event
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

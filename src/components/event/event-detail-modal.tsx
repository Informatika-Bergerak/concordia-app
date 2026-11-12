/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { X, Calendar, Clock, MapPin, Share2, Heart, Users, Globe, Building2, Check, Flag } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type EventDetailModalProps = {
  event: EventItem;
  currentUserId: number;
  onClose: () => void;
  onJoinToggle: (event: EventItem) => void;
  onInterestedToggle: (event: EventItem) => void;
  onShare: (event: EventItem) => void;
  onReport: (event: EventItem) => void;
};

export function EventDetailModal({
  event,
  currentUserId,
  onClose,
  onJoinToggle,
  onInterestedToggle,
  onShare,
  onReport,
}: EventDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "participants">("info");
  const isJoined = event.participants.includes(currentUserId);
  const isInterested = event.interested.includes(currentUserId);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className={styles.detailModalContent}>
        {/* Fixed Top Header / Cover Image Area */}
        <div style={{ position: "relative", width: "100%", height: "220px", background: "#F4DBDB", flexShrink: 0 }}>
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#8A0B0B" }}>
              <Calendar size={64} />
            </div>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.9)", borderRadius: "50%" }}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
          <span className={styles.statusBadge}>
            {event.status === "CANCELLED" ? "Dibatalkan" : event.isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Header Info & Tabs (Non-scrollable relative to body) */}
        <div style={{ padding: "20px 24px 0", background: "#ffffff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div className={styles.creatorAvatar}>
                {event.creatorFoto ? (
                  <img src={event.creatorFoto} alt={event.creatorName} className={styles.creatorFotoImg} />
                ) : (
                  event.creatorName.charAt(0)
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 className={styles.creatorName}>{event.creatorName}</h4>
                <p className={styles.creatorSub}>{event.creatorJurusan || "Mahasiswa Concordia"}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button type="button" className={styles.iconBtn} onClick={() => onShare(event)} title="Bagikan">
                <Share2 size={18} />
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${isInterested ? styles.active : ""}`}
                onClick={() => onInterestedToggle(event)}
                title="Interested"
              >
                <Heart size={18} fill={isInterested ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => onReport(event)}
                title="Laporkan Event"
                style={{ color: "#8A0B0B" }}
              >
                <Flag size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <span className={styles.badgeCategory}>{event.category}</span>
            {event.groupName && <span className={styles.badgeCategory}>Grup: {event.groupName}</span>}
          </div>

          <h1 id="detail-title" style={{ fontSize: "22px", fontWeight: 800, color: "#2E0404", margin: "0 0 12px" }}>
            {event.title}
          </h1>

          {/* Tabs Navigation */}
          <div style={{ display: "flex", borderBottom: "1px solid #E49F9F" }}>
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "info" ? "3px solid #B80E0E" : "3px solid transparent",
                fontWeight: 700,
                color: activeTab === "info" ? "#B80E0E" : "#5C0707",
                cursor: "pointer",
              }}
            >
              Event Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "participants" ? "3px solid #B80E0E" : "3px solid transparent",
                fontWeight: 700,
                color: activeTab === "participants" ? "#B80E0E" : "#5C0707",
                cursor: "pointer",
              }}
            >
              Peserta ({event.participants.length})
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className={styles.detailScrollBody}>
          {activeTab === "info" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#fff9f9", border: "1px solid #E49F9F", borderRadius: "12px", padding: "16px", display: "grid", gap: "12px" }}>
                <div className={styles.eventInfoRow}>
                  <Calendar size={18} color="#B80E0E" />
                  <span><strong>Tanggal:</strong> {event.startDate} {event.startDate !== event.endDate ? `s/d ${event.endDate}` : ""}</span>
                </div>
                <div className={styles.eventInfoRow}>
                  <Clock size={18} color="#B80E0E" />
                  <span><strong>Waktu:</strong> {event.startTime} - {event.endTime} WIB</span>
                </div>
                <div className={styles.eventInfoRow}>
                  <MapPin size={18} color="#B80E0E" />
                  <span><strong>Lokasi:</strong> {event.location}</span>
                </div>
                <div className={styles.eventInfoRow}>
                  {event.isOnline ? <Globe size={18} color="#B80E0E" /> : <Building2 size={18} color="#B80E0E" />}
                  <span><strong>Tipe:</strong> {event.isOnline ? "Online Event" : "Offline Event"}</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#2E0404", marginBottom: "8px" }}>Deskripsi Lengkap</h3>
                <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#5C0707", whiteSpace: "pre-line", margin: 0 }}>
                  {event.description}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "14px", color: "#8A0B0B", marginBottom: "12px" }}>
                Total {event.participants.length} mahasiswa telah bergabung ke event ini.
              </p>
              <div style={{ display: "grid", gap: "8px" }}>
                {event.participants.map((pId) => (
                  <div key={pId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#fff9f9", borderRadius: "8px", border: "1px solid #E49F9F" }}>
                    <div className={styles.creatorAvatar} style={{ width: "32px", height: "32px", fontSize: "12px" }}>
                      P{pId}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#2E0404" }}>
                      {pId === currentUserId ? "Anda (Peserta)" : `Mahasiswa Peserta #${pId}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Footer */}
        <div className={styles.detailFooter}>
          <div className={styles.participantCount}>
            <Users size={18} color="#B80E0E" /> {event.participants.length} Partisipasi
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Tutup
            </button>
            {event.status !== "CANCELLED" && (
              <button
                type="button"
                className={`${styles.btnJoin} ${isJoined ? styles.btnJoined : ""}`}
                onClick={() => onJoinToggle(event)}
              >
                {isJoined ? <><Check size={16} /> Joined</> : "Join Event"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

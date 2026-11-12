/* eslint-disable @next/next/no-img-element */
"use client";

import { Calendar, MapPin, Users, Heart, Check } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type EventCardProps = {
  event: EventItem;
  currentUserId: number;
  onJoinToggle: (event: EventItem) => void;
  onInterestedToggle: (event: EventItem) => void;
  onCardClick: (event: EventItem) => void;
};

export function EventCard({
  event,
  currentUserId,
  onJoinToggle,
  onInterestedToggle,
  onCardClick,
}: EventCardProps) {
  const isJoined = event.participants.includes(currentUserId);
  const isInterested = event.interested.includes(currentUserId);

  return (
    <div className={styles.eventCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.creatorAvatar}>
          {event.creatorFoto ? (
            <img src={event.creatorFoto} alt={event.creatorName} className={styles.creatorFotoImg} />
          ) : (
            event.creatorName.charAt(0)
          )}
        </div>
        <div className={styles.creatorMeta}>
          <div className={styles.creatorName}>{event.creatorName}</div>
          <div className={styles.creatorSub}>{event.creatorJurusan || "Mahasiswa Concordia"}</div>
          <time className={styles.postTime}>{new Date(event.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</time>
        </div>
      </div>

      {/* Cover Image & Status */}
      <div className={styles.coverWrap} onClick={() => onCardClick(event)} style={{ cursor: "pointer" }}>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className={styles.coverImage} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#8A0B0B" }}>
            <Calendar size={40} />
          </div>
        )}
        <span className={styles.statusBadge}>
          {event.status === "CANCELLED" ? "Dibatalkan" : event.isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {/* Body */}
      <div className={styles.cardBody} onClick={() => onCardClick(event)} style={{ cursor: "pointer" }}>
        <div>
          <span className={styles.badgeCategory}>{event.category}</span>
          {event.groupName && <span className={styles.badgeCategory}>{event.groupName}</span>}
        </div>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        <p className={styles.eventDesc}>{event.description}</p>

        <div className={styles.eventInfoRow}>
          <Calendar size={14} color="#B80E0E" />
          <span>{event.startDate} • {event.startTime} WIB</span>
        </div>
        <div className={styles.eventInfoRow}>
          <MapPin size={14} color="#B80E0E" />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.location}</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.participantCount}>
          <Users size={16} color="#B80E0E" /> {event.participants.length} Peserta
        </div>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={`${styles.btnInterested} ${isInterested ? styles.active : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onInterestedToggle(event);
            }}
            title="Tandai Interested"
          >
            <Heart size={16} fill={isInterested ? "currentColor" : "none"} />
          </button>
          {event.status !== "CANCELLED" && (
            <button
              type="button"
              className={`${styles.btnJoin} ${isJoined ? styles.btnJoined : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onJoinToggle(event);
              }}
            >
              {isJoined ? <><Check size={14} /> Joined</> : "Join Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

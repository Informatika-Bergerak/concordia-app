/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type FormEvent } from "react";
import { X, Upload } from "lucide-react";
import { EVENT_CATEGORIES, CONCORDIA_GROUPS } from "@/modules/event/constants";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type EditEventModalProps = {
  event: EventItem;
  onClose: () => void;
  onUpdated: (updated: EventItem) => void;
};

export function EditEventModal({ event, onClose, onUpdated }: EditEventModalProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startDate, setStartDate] = useState(event.startDate);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endDate, setEndDate] = useState(event.endDate);
  const [endTime, setEndTime] = useState(event.endTime);
  const [location, setLocation] = useState(event.location);
  const [category, setCategory] = useState(event.category);
  const [coverImage, setCoverImage] = useState<string | null>(event.coverImage);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran file gambar maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Semua field wajib diisi.");
      return;
    }

    const updatedEvent: EventItem = {
      ...event,
      title: title.trim(),
      description: description.trim(),
      startDate,
      startTime,
      endDate,
      endTime,
      location: location.trim(),
      category,
      coverImage,
    };

    onUpdated(updatedEvent);
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 id="edit-modal-title" className={styles.modalTitle}>Edit Event</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>

        {error && <p style={{ color: "#B80E0E", background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nama Event</label>
            <input
              type="text"
              className={styles.formInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Deskripsi Event</label>
            <textarea
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tanggal Mulai</label>
              <input
                type="date"
                className={styles.formInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Jam Mulai</label>
              <input
                type="time"
                className={styles.formInput}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tanggal Selesai</label>
              <input
                type="date"
                className={styles.formInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Jam Selesai</label>
              <input
                type="time"
                className={styles.formInput}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Lokasi Event</label>
            <input
              type="text"
              className={styles.formInput}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Kategori Event</label>
            <select
              className={styles.formSelect}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Cover Image</label>
            <div className={styles.imageUploadBox}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
              <Upload size={24} color="#B80E0E" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>Ganti foto sampul event</p>
            </div>
            {coverImage && (
              <img src={coverImage} alt="Cover Preview" className={styles.previewImg} />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Kembali
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

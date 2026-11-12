/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type FormEvent } from "react";
import { X, Calendar, MapPin, Globe, Upload, Users } from "lucide-react";
import { CONCORDIA_GROUPS, EVENT_CATEGORIES } from "@/modules/event/constants";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type CreateEventModalProps = {
  currentUser: { id: number; name: string; fotoProfil: string | null; jurusan: string | null };
  onClose: () => void;
  onCreated: (event: EventItem) => void;
};

export function CreateEventModal({ currentUser, onClose, onCreated }: CreateEventModalProps) {
  const [locationType, setLocationType] = useState<"group" | "custom">("group");
  const [selectedGroup, setSelectedGroup] = useState(CONCORDIA_GROUPS[0]);
  const [customLocation, setCustomLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [endTime, setEndTime] = useState("12:00");
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [coverImage, setCoverImage] = useState<string>("https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80");
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
    if (!title.trim()) {
      setError("Nama event wajib diisi.");
      return;
    }
    if (!description.trim()) {
      setError("Deskripsi event wajib diisi.");
      return;
    }
    const finalLocation = locationType === "group" ? `Grup Concordia: ${selectedGroup}` : customLocation.trim();
    if (!finalLocation) {
      setError("Lokasi event wajib diisi.");
      return;
    }
    if (new Date(`${endDate}T${endTime}`) < new Date(`${startDate}T${startTime}`)) {
      setError("Tanggal dan waktu selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      startDate,
      startTime,
      endDate,
      endTime,
      location: finalLocation,
      isOnline: locationType === "custom" ? isOnline : false,
      groupName: locationType === "group" ? selectedGroup : null,
      category,
      coverImage,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorFoto: currentUser.fotoProfil,
      creatorJurusan: currentUser.jurusan,
      createdAt: new Date().toISOString(),
      status: "UPCOMING",
      participants: [currentUser.id],
      interested: [],
    };

    onCreated(newEvent);
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>Dimana event akan dilaksanakan?</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>

        {error && <p style={{ color: "#B80E0E", background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="locationType"
                checked={locationType === "group"}
                onChange={() => setLocationType("group")}
              />
              <Users size={18} /> Concordia Group ({selectedGroup})
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="locationType"
                checked={locationType === "custom"}
                onChange={() => setLocationType("custom")}
              />
              <MapPin size={18} /> Tentukan Lokasi Sendiri
            </label>
          </div>

          {locationType === "group" ? (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pilih Grup Tujuan</label>
              <select
                className={styles.formSelect}
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                {CONCORDIA_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lokasi Event</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Contoh: Auditorium Utama / Link Zoom"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  style={{ accentColor: "#B80E0E", width: "18px", height: "18px" }}
                />
                <label htmlFor="isOnline" style={{ fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  Event ini bersifat Online
                </label>
              </div>
            </>
          )}

          <hr style={{ border: "0", borderTop: "1px solid #E49F9F", margin: "20px 0" }} />

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nama Event</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Masukkan nama event..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Deskripsi Event</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Jelaskan detail event..."
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
            <label className={styles.formLabel}>Cover Image (Foto Sampul)</label>
            <div className={styles.imageUploadBox}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
              <Upload size={24} color="#B80E0E" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>Klik atau seret gambar ke sini</p>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8A0B0B" }}>PNG, JPG maksimal 2MB</p>
            </div>
            {coverImage && (
              <img src={coverImage} alt="Preview Cover" className={styles.previewImg} />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Kembali
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Buat Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

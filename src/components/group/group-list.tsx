"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  UsersRound,
  MessageCircle,
  Camera,
  X,
} from "lucide-react";
import { createGroupAction } from "@/modules/group/actions";
import type { GroupListItem } from "@/modules/group/types";
import styles from "./group.module.css";

type GroupListProps = {
  groups: GroupListItem[];
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) {
    return d.toLocaleDateString("id-ID", { weekday: "short" });
  }
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
}

function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nama grup wajib diisi";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const result = await createGroupAction({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (result.ok) {
        onCreated(result.id);
      } else {
        setErrors(result.fieldErrors ?? { form: result.error });
      }
    });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.formCard}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className={styles.formTitle}>Buat Grup Baru</h2>
        <p className={styles.formHint}>
          Buat grup untuk berdiskusi dengan anggota Concordia
        </p>

        {/* Avatar upload */}
        <div className={styles.avatarUpload}>
          <div className={styles.avatarPreview}>
            {photoPreview ? (
              <img src={photoPreview} alt="Preview foto grup" />
            ) : (
              <Camera size={24} />
            )}
          </div>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => fileRef.current?.click()}
          >
            Pilih Foto
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handlePhotoChange}
          />
        </div>

        {/* Name */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="group-name">
            Nama Grup <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            id="group-name"
            className={`${styles.input} ${errors.name ? styles.invalid : ""}`}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="Masukkan nama grup"
            maxLength={100}
            autoFocus
          />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="group-desc">
            Deskripsi <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>(opsional)</span>
          </label>
          <textarea
            id="group-desc"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tambahkan deskripsi grup"
            maxLength={500}
            rows={3}
          />
        </div>

        {errors.form && <p className={styles.error}>{errors.form}</p>}

        {/* Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isPending}
          >
            Batal
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isPending}
          >
            {isPending ? "Membuat..." : "Buat Grup"}
          </button>
        </div>
      </form>
    </div>
  );
}

function GroupCard({ group }: { group: GroupListItem }) {
  return (
    <Link href={`/grup/${group.id}`} className={styles.card}>
      <div className={styles.cardAvatar}>
        {group.photo ? (
          <img src={group.photo} alt={group.name} />
        ) : (
          getInitials(group.name)
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{group.name}</h3>
        <p className={styles.cardPreview}>
          {group.lastMessage
            ? `${group.lastMessage.senderName}: ${group.lastMessage.content}`
            : group.description || "Belum ada pesan"}
        </p>
      </div>
      <div className={styles.cardMeta}>
        {group.lastMessage && (
          <span className={styles.cardTime}>
            {formatTime(group.lastMessage.createdAt)}
          </span>
        )}
        <span className={styles.cardMembers}>
          <Users size={12} />
          {group.memberCount}
        </span>
      </div>
    </Link>
  );
}

export function GroupListPage({ groups }: GroupListProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filtered = searchQuery.trim()
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : groups;

  const handleCreated = (id: number) => {
    setShowForm(false);
    router.refresh();
    router.push(`/grup/${id}`);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Grup Saya</h1>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Buat Grup
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Cari grup..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari grup"
          />
        </div>
      </div>

      {/* Group list */}
      {filtered.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionHead}>
            Daftar Grup ({filtered.length})
          </h2>
          <div className={styles.list}>
            {filtered.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      ) : groups.length > 0 && searchQuery.trim() ? (
        <div className={styles.empty}>
          <Search size={40} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Grup tidak ditemukan</h3>
          <p className={styles.emptyText}>
            Tidak ada grup yang cocok dengan &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className={styles.empty}>
          <UsersRound size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Belum ada grup</h3>
          <p className={styles.emptyText}>
            Kamu belum memiliki grup. Buat grup baru untuk mulai berdiskusi
            dengan anggota Concordia lainnya.
          </p>
          <button
            type="button"
            className={styles.emptyBtn}
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Buat Grup Baru
          </button>
        </div>
      )}

      {/* Create group modal */}
      {showForm && (
        <CreateGroupModal
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

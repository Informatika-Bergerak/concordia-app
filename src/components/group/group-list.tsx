"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  UsersRound,
  MessageCircle,
  UserPlus,
  Camera,
  X,
} from "lucide-react";
import { UPLOAD_RULES } from "@/lib/uploads/config";
import { createGroupAction } from "@/modules/group/actions";
import type { GroupListItem } from "@/modules/group/types";
import { GroupDiscovery } from "./group-discovery";
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
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rule = UPLOAD_RULES.image;
    if (!rule.mimes.includes(file.type)) {
      setErrors({ photo: `Format foto harus ${rule.label}.` });
      return;
    }
    if (file.size > rule.maxBytes) {
      setErrors({ photo: `Ukuran foto maksimal ${rule.maxBytes / 1024 / 1024} MB.` });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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
      let photoUrl: string | undefined;
      if (photoFile) {
        try {
          const body = new FormData();
          body.append("file", photoFile);
          body.append("folder", "groups");
          const response = await fetch("/api/upload", { method: "POST", body });
          const upload = await response.json().catch(() => null);
          if (!response.ok) throw new Error(upload?.error ?? "Gagal mengunggah foto");
          photoUrl = upload.url;
        } catch (error) {
          setErrors({ form: error instanceof Error ? error.message : "Gagal mengunggah foto" });
          return;
        }
      }

      const result = await createGroupAction({
        name: name.trim(),
        description: description.trim() || undefined,
        photo: photoUrl,
        visibility,
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
              <Image src={photoPreview} alt="Preview foto grup" width={64} height={64} unoptimized />
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
            accept={UPLOAD_RULES.image.mimes.join(",")}
            className={styles.hiddenInput}
            onChange={handlePhotoChange}
          />
          {errors.photo && <p className={styles.error}>{errors.photo}</p>}
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

        <div className={styles.privacyField}>
          <span className={styles.label}>Privasi Grup</span>
          <label className={styles.privacyOption}><input type="radio" name="group-visibility" checked={visibility === "PUBLIC"} onChange={() => setVisibility("PUBLIC")} /> Publik <small>Dapat ditemukan di Ikuti Grup.</small></label>
          <label className={styles.privacyOption}><input type="radio" name="group-visibility" checked={visibility === "PRIVATE"} onChange={() => setVisibility("PRIVATE")} /> Privat <small>Hanya dapat dimasuki melalui penambahan anggota.</small></label>
        </div>

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
          <Image src={group.photo} alt={group.name} width={46} height={46} unoptimized />
        ) : (
          getInitials(group.name)
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{group.name}</h3>
        <p className={styles.cardPreview}>{group.description || "Belum ada deskripsi grup."}</p>
      </div>
    </Link>
  );
}

export function GroupListPage({ groups }: GroupListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupItems, setGroupItems] = useState(groups);
  const router = useRouter();

  useEffect(() => {
    const events = new EventSource("/api/groups/events");
    events.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type?: string };
      if (data.type === "connected" || data.type === "keepalive") return;

      // Fetch the latest memberships immediately instead of waiting for a
      // server component refresh to arrive.
      void fetch("/api/groups/mine", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((latest) => {
          if (latest) setGroupItems(latest);
        });
    };
    return () => events.close();
  }, []);

  useEffect(() => {
    setGroupItems(groups);
  }, [groups]);

  const filtered = searchQuery.trim()
    ? groupItems.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : groupItems;

  const handleCreated = (id: number) => {
    setShowForm(false);
    router.refresh();
    router.push(`/grup/${id}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}><h1 className={styles.headerTitle}>Group Kampus</h1><p>Temukan, ikuti, dan bergabung dengan berbagai grup komunitas di lingkungan Concordia.</p></div>
      <div className={styles.toolbar}><button type="button" className={styles.createBtn} onClick={() => setShowForm(true)}><Plus size={16} />Buat Grup</button><button type="button" className={styles.followBtn} onClick={() => setShowDiscovery(true)}><UserPlus size={16} />Ikuti Grup</button></div>

      {showDiscovery && <div className={styles.discoveryOverlay}><div className={styles.discoveryModal}><button className={styles.discoveryClose} onClick={() => setShowDiscovery(false)} aria-label="Tutup">×</button><GroupDiscovery initialGroups={[]} /></div></div>}

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
      ) : groupItems.length > 0 && searchQuery.trim() ? (
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

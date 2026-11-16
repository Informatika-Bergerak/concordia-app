"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ReportCategory, ReportVisibility } from "@/modules/report/types";
import { CalendarDays } from "lucide-react";
import { UPLOAD_RULES } from "@/lib/uploads/config";
import { uploadFile } from "@/lib/uploads/client";
import { createReportAction, updateReportAction } from "@/modules/report/actions";
import { CATEGORY_OPTIONS, VISIBILITY_HINTS, VISIBILITY_OPTIONS } from "@/modules/report/constants";
import { createReportSchema } from "@/modules/report/schemas";
import styles from "./report.module.css";

type Errors = Partial<Record<string, string>>;

const today = () => new Date().toISOString().slice(0, 10);

/** Data awal bila form dipakai untuk mengubah laporan yang sudah ada. */
export type ReportFormInitial = {
  id: number;
  title: string;
  description: string;
  location: string;
  category: ReportCategory;
  occurredAt: string;
  visibility: ReportVisibility;
  photoUrl: string | null;
};

export function ReportForm({ initial }: { initial?: ReportFormInitial }) {
  const router = useRouter();
  const editing = initial !== undefined;
  const [existingPhoto, setExistingPhoto] = useState<string | null>(initial?.photoUrl ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<ReportVisibility>(initial?.visibility ?? "PUBLIC");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onPickImage(file: File | undefined) {
    setImageError(null);
    if (!file) return;
    const rule = UPLOAD_RULES.image;
    if (!rule.mimes.includes(file.type)) {
      setImageError(`Format harus ${rule.label}`);
      return;
    }
    if (file.size > rule.maxBytes) {
      setImageError(`Ukuran gambar maksimal ${rule.maxBytes / 1024 / 1024} MB`);
      return;
    }
    setFile(file);
    setPhotoRemoved(false);
    setPreview(URL.createObjectURL(file));
  }

  function onRemovePhoto() {
    setFile(null);
    setPreview(null);
    setImageError(null);
    if (fileRef.current) fileRef.current.value = "";
    if (existingPhoto) {
      setExistingPhoto(null);
      setPhotoRemoved(true);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = createReportSchema.safeParse(data);

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      // 1) Unggah foto baru ke Cloudinary (jika ada), 2) simpan laporan beserta metadata foto.
      // photo: undefined = foto tidak diubah (hanya saat edit), null = tanpa foto / dihapus.
      let photo: Awaited<ReturnType<typeof uploadFile>> | null | undefined;
      if (file) photo = await uploadFile(file, "reports");
      else if (photoRemoved) photo = null;
      else photo = editing ? undefined : null;

      const photoPayload =
        photo && {
          url: photo.url,
          publicId: photo.publicId,
          format: photo.format,
          bytes: photo.bytes,
          width: photo.width,
          height: photo.height,
        };

      const result = initial
        ? await updateReportAction({
            reportId: initial.id,
            ...parsed.data,
            ...(photo !== undefined ? { photo: photoPayload } : {}),
          })
        : await createReportAction({ ...parsed.data, photo: photoPayload ?? null });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setSubmitError(result.error);
        return;
      }
      router.push(initial ? `/laporan/${initial.id}` : "/laporan");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan laporan");
    } finally {
      setSubmitting(false);
    }
  }

  const cls = (name: string, base: string) => `${base} ${errors[name] ? styles.invalid : ""}`;

  return (
    <form className={styles.formCard} onSubmit={onSubmit} noValidate>
      <div>
        <h2 className={styles.formTitle}>{editing ? "Edit Laporan" : "Laporan Masalah"}</h2>
        <p className={styles.formHint}>
          {editing
            ? "Perbarui isi laporanmu."
            : "Jangan takut dengan masalah yang ada, coba laporkan terlebih dahulu."}
        </p>
      </div>


      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Topik Masalah</label>
        <input id="title" name="title" defaultValue={initial?.title} className={cls("title", styles.input)} placeholder="Masalah apa yang sedang terjadi ?" maxLength={100} aria-invalid={!!errors.title} />
        {errors.title && <p className={styles.error}>{errors.title}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Deskripsi Masalah</label>
        <textarea id="description" name="description" defaultValue={initial?.description} className={cls("description", styles.textarea)} placeholder="Jelaskan masalah yang terjadi" maxLength={1000} aria-invalid={!!errors.description} />
        {errors.description && <p className={styles.error}>{errors.description}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="location">Lokasi</label>
        <input id="location" name="location" defaultValue={initial?.location} className={cls("location", styles.input)} placeholder="Dimana hal itu ada atau terjadi ?" maxLength={120} aria-invalid={!!errors.location} />
        {errors.location && <p className={styles.error}>{errors.location}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="category">Kategori Masalah</label>
        <select id="category" name="category" defaultValue={initial?.category ?? ""} className={cls("category", styles.select)} aria-invalid={!!errors.category}>
          <option value="" disabled>Termasuk masalah apa ?</option>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.category && <p className={styles.error}>{errors.category}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="occurredAt">
          <CalendarDays size={14} aria-hidden style={{ verticalAlign: "-2px" }} /> Tanggal Terjadi atau Terlihat
        </label>
        <input id="occurredAt" name="occurredAt" type="date" max={today()} defaultValue={initial?.occurredAt ?? today()} className={cls("occurredAt", styles.input)} aria-invalid={!!errors.occurredAt} />
        {errors.occurredAt && <p className={styles.error}>{errors.occurredAt}</p>}
      </div>

      <fieldset className={styles.field} style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className={styles.label}>Visibilitas</legend>
        <div className={styles.radios}>
          {VISIBILITY_OPTIONS.map(([value, label]) => (
            <label key={value} className={styles.radio}>
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <p className={styles.formHint}>{VISIBILITY_HINTS[visibility]}</p>
      </fieldset>

      <div className={styles.field}>
        <span className={styles.label}>Cover Image</span>
        <input ref={fileRef} type="file" accept={UPLOAD_RULES.image.mimes.join(",")} className={styles.hiddenInput} onChange={(e) => onPickImage(e.target.files?.[0])} aria-label="Pilih gambar sampul" />
        <div className={styles.photoActions}>
          <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
            {preview || existingPhoto ? "Ganti Foto" : "Upload Image"}
          </button>
          {(preview || existingPhoto) && (
            <button type="button" className={styles.ghostBtn} onClick={onRemovePhoto}>Hapus Foto</button>
          )}
        </div>
        {imageError && <p className={styles.error}>{imageError}</p>}
        <div className={styles.preview}>
          {preview || existingPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(preview ?? existingPhoto) as string} alt="Pratinjau gambar laporan" />
          ) : (
            "Image Preview"
          )}
        </div>
      </div>

      {submitError && <p className={styles.error} role="alert">{submitError}</p>}

      <div className={styles.formActions}>
        <Link href={initial ? `/laporan/${initial.id}` : "/laporan"} className={styles.back}>Kembali</Link>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? (editing ? "Menyimpan..." : "Mengirim...") : editing ? "Simpan Perubahan" : "Kirim Laporan"}
        </button>
      </div>
    </form>
  );
}

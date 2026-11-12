"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays } from "lucide-react";
import { UPLOAD_RULES } from "@/lib/uploads/config";
import { CATEGORY_OPTIONS } from "@/modules/report/constants";
import { createReportSchema } from "@/modules/report/schemas";
import styles from "./report.module.css";

type Errors = Partial<Record<string, string>>;

const today = () => new Date().toISOString().slice(0, 10);

export function ReportForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
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
    setPreview(URL.createObjectURL(file));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = createReportSchema.safeParse(data);

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      setNotice(null);
      return;
    }

    setErrors({});
    // TODO (Tugas 2 dan 3): panggil server action createReport dan uploadFile("reports").
    setNotice("Data valid. Penyimpanan laporan akan dihubungkan ke backend pada tahap berikutnya.");
  }

  const cls = (name: string, base: string) => `${base} ${errors[name] ? styles.invalid : ""}`;

  return (
    <form className={styles.formCard} onSubmit={onSubmit} noValidate>
      <div>
        <h2 className={styles.formTitle}>Laporan Masalah</h2>
        <p className={styles.formHint}>Jangan takut dengan masalah yang ada, coba laporkan terlebih dahulu.</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Topik Masalah</label>
        <input id="title" name="title" className={cls("title", styles.input)} placeholder="Masalah apa yang sedang terjadi ?" maxLength={100} aria-invalid={!!errors.title} />
        {errors.title && <p className={styles.error}>{errors.title}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Deskripsi Masalah</label>
        <textarea id="description" name="description" className={cls("description", styles.textarea)} placeholder="Jelaskan masalah yang terjadi" maxLength={1000} aria-invalid={!!errors.description} />
        {errors.description && <p className={styles.error}>{errors.description}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="location">Lokasi</label>
        <input id="location" name="location" className={cls("location", styles.input)} placeholder="Dimana hal itu ada atau terjadi ?" maxLength={120} aria-invalid={!!errors.location} />
        {errors.location && <p className={styles.error}>{errors.location}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="category">Kategori Masalah</label>
        <select id="category" name="category" defaultValue="" className={cls("category", styles.select)} aria-invalid={!!errors.category}>
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
        <input id="occurredAt" name="occurredAt" type="date" max={today()} defaultValue={today()} className={cls("occurredAt", styles.input)} aria-invalid={!!errors.occurredAt} />
        {errors.occurredAt && <p className={styles.error}>{errors.occurredAt}</p>}
      </div>

      <fieldset className={styles.field} style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className={styles.label}>Visibilitas</legend>
        <div className={styles.radios}>
          <label className={styles.radio}><input type="radio" name="visibility" value="PUBLIC" defaultChecked /> Public</label>
          <label className={styles.radio}><input type="radio" name="visibility" value="PRIVATE" /> Private</label>
        </div>
      </fieldset>

      <div className={styles.field}>
        <span className={styles.label}>Cover Image</span>
        <input ref={fileRef} type="file" accept={UPLOAD_RULES.image.mimes.join(",")} className={styles.hiddenInput} onChange={(e) => onPickImage(e.target.files?.[0])} aria-label="Pilih gambar sampul" />
        <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>Upload Image</button>
        {imageError && <p className={styles.error}>{imageError}</p>}
        <div className={styles.preview}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau gambar laporan" />
          ) : (
            "Image Preview"
          )}
        </div>
      </div>

      {notice && <p className={styles.notice} role="status">{notice}</p>}

      <div className={styles.formActions}>
        <Link href="/laporan" className={styles.back}>Kembali</Link>
        <button type="submit" className={styles.submit}>Kirim Laporan</button>
      </div>
    </form>
  );
}

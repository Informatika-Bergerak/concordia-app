"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AVAILABILITY_OPTIONS, CATEGORY_OPTIONS, CONDITION_OPTIONS } from "@/modules/marketplace/constants";
import { validateListingForm, type ListingFormErrors, type ListingFormValues } from "@/modules/marketplace/form-validation";
import styles from "./marketplace.module.css";

const EMPTY_VALUES: ListingFormValues = {
  title: "",
  price: "",
  category: "",
  condition: "",
  availability: "",
  description: "",
  location: "",
  allowCod: false,
  allowShipping: false,
};

type Props = {
  mode: "create" | "edit";
  initialValues?: ListingFormValues;
  /** Foto yang sudah tersimpan (mode edit). */
  currentPhotoUrl?: string | null;
};

export function ListingForm({ mode, initialValues, currentPhotoUrl = null }: Props) {
  const [values, setValues] = useState<ListingFormValues>(initialValues ?? EMPTY_VALUES);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [done, setDone] = useState(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function setField<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDone(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateListingForm(values, photo ? { type: photo.type, size: photo.size } : null, {
      requirePhoto: !isEdit || !currentPhotoUrl,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setDone(false);
      return;
    }
    // TODO: kirim ke server action (buat/ubah penawaran + unggah foto lewat /api/upload) saat backend selesai.
    setDone(true);
  }

  const shownPhoto = previewUrl ?? currentPhotoUrl;
  const priceDisplay = values.price ? Number(values.price).toLocaleString("id-ID") : "";

  return (
    <div className={styles.page}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.formHead}>
          <Link href="/marketplace" className={styles.backBtn} aria-label="Kembali ke marketplace">
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
          <h1>{isEdit ? "Edit Tawaran" : "Tawaran Baru"}</h1>
        </div>
        <p className={styles.formLead}>Tawaran ke MarketPlace</p>

        <div className={styles.formCols}>
          <fieldset className={styles.fieldset}>
            <legend>Umum</legend>
            <p className={styles.hint}>Beri penjelasan selengkap mungkin</p>

            <label className={styles.field}>
              <span className={styles.label}>Judul <span className={styles.required} aria-hidden="true">*</span></span>
              <input className={styles.input} required value={values.title} onChange={(event) => setField("title", event.target.value)} placeholder="Apa nama barang?" aria-invalid={!!errors.title} maxLength={100} />
              {errors.title && <span className={styles.error} role="alert">{errors.title}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Harga <span className={styles.required} aria-hidden="true">*</span></span>
              <input className={styles.input} required inputMode="numeric" value={priceDisplay} onChange={(event) => setField("price", event.target.value.replace(/\D/g, ""))} placeholder="Berapa harga?" aria-invalid={!!errors.price} />
              {errors.price && <span className={styles.error} role="alert">{errors.price}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Kategori <span className={styles.required} aria-hidden="true">*</span></span>
              <select className={styles.select} required value={values.category} onChange={(event) => setField("category", event.target.value as ListingFormValues["category"])} aria-invalid={!!errors.category}>
                <option value="">Termasuk kategori apa?</option>
                {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {errors.category && <span className={styles.error} role="alert">{errors.category}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Kondisi <span className={styles.required} aria-hidden="true">*</span></span>
              <select className={styles.select} required value={values.condition} onChange={(event) => setField("condition", event.target.value as ListingFormValues["condition"])} aria-invalid={!!errors.condition}>
                <option value="">Bagaimana kondisinya?</option>
                {CONDITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {errors.condition && <span className={styles.error} role="alert">{errors.condition}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Ketersediaan <span className={styles.required} aria-hidden="true">*</span></span>
              <select className={styles.select} required value={values.availability} onChange={(event) => setField("availability", event.target.value as ListingFormValues["availability"])} aria-invalid={!!errors.availability}>
                <option value="">Bagaimana ketersediaan barang?</option>
                {AVAILABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {errors.availability && <span className={styles.error} role="alert">{errors.availability}</span>}
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Cover Image <span className={styles.required} aria-hidden="true">*</span></span>
              <label className={styles.uploadBtn}>
                Upload Image
                <input
                  className={styles.visuallyHidden}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={!isEdit || !currentPhotoUrl}
                  onChange={(event) => { setPhoto(event.target.files?.[0] ?? null); setDone(false); }}
                />
              </label>
              <div className={styles.preview}>
                {shownPhoto ? (
                  <Image src={shownPhoto} alt="Pratinjau cover image" fill unoptimized className={styles.photoImg} />
                ) : (
                  <span>Image Preview</span>
                )}
              </div>
              {errors.photo && <span className={styles.error} role="alert">{errors.photo}</span>}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Detail Selengkapnya</legend>
            <p className={styles.hint}>Beri penjelasan tambahan terkait produk</p>

            <label className={styles.field}>
              <span className={styles.label}>Keterangan <span className={styles.required} aria-hidden="true">*</span></span>
              <textarea className={styles.textarea} required rows={5} value={values.description} onChange={(event) => setField("description", event.target.value)} placeholder="Beri rincian produk?" aria-invalid={!!errors.description} maxLength={2000} />
              {errors.description && <span className={styles.error} role="alert">{errors.description}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Lokasi <span className={styles.required} aria-hidden="true">*</span></span>
              <input className={styles.input} required value={values.location} onChange={(event) => setField("location", event.target.value)} placeholder="Lokasi penjualan?" aria-invalid={!!errors.location} />
              {errors.location && <span className={styles.error} role="alert">{errors.location}</span>}
            </label>

            <div className={styles.field}>
              <span id="preference-label" className={styles.label}>Preferensi Penjualan <span className={styles.required} aria-hidden="true">*</span></span>
              <span id="preference-hint" className={styles.visuallyHidden}>Wajib pilih minimal satu preferensi penjualan.</span>
              <div
                className={styles.checkRow}
                role="group"
                aria-labelledby="preference-label"
                aria-describedby={errors.preference ? "preference-error" : "preference-hint"}
              >
                <label className={styles.check}>
                  <input type="checkbox" checked={values.allowCod} onChange={(event) => setField("allowCod", event.target.checked)} />
                  Pertemuan Publik (COD)
                </label>
                <label className={styles.check}>
                  <input type="checkbox" checked={values.allowShipping} onChange={(event) => setField("allowShipping", event.target.checked)} />
                  Pengantaran (Ekspedisi)
                </label>
              </div>
              {errors.preference && <span id="preference-error" className={styles.error} role="alert">{errors.preference}</span>}
            </div>
          </fieldset>
        </div>

        {Object.keys(errors).length > 0 && (
          <p className={styles.error} role="alert">Periksa kembali isian yang ditandai.</p>
        )}
        {done && (
          <p className={styles.success} role="status">
            Isian valid. Tampilan demo: penyimpanan aktif setelah backend Marketplace terhubung.
          </p>
        )}

        <button type="submit" className={isEdit ? styles.submitEdit : styles.submitBtn}>
          {isEdit ? "Edit Tawaran" : "Terbitkan Tawaran"}
        </button>
      </form>
    </div>
  );
}

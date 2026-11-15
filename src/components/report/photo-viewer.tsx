"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import styles from "./report.module.css";

// Gambar yang dapat diklik untuk dilihat lebih besar. Memakai <dialog> bawaan browser
// sehingga Esc menutup dan fokus tetap berada di dalam dialog.
export function PhotoViewer({
  src,
  alt,
  className,
  buttonClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  buttonClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={buttonClassName ?? styles.photoBtn}
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Lihat foto lebih besar: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={className} src={src} alt={alt} />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.lightbox}
        aria-label={alt}
        onClick={(e) => {
          // Klik di area gelap (bukan pada gambar) menutup dialog.
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <button
          type="button"
          className={styles.lightboxClose}
          onClick={() => dialogRef.current?.close()}
          aria-label="Tutup foto"
        >
          <X size={22} aria-hidden />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.lightboxImg} src={src} alt={alt} loading="lazy" />
      </dialog>
    </>
  );
}

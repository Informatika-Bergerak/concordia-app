"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleSupportAction } from "@/modules/report/actions";
import styles from "./report.module.css";

export function SupportButton({
  reportId,
  initialSupported,
  initialCount,
}: {
  reportId: number;
  initialSupported: boolean;
  initialCount: number;
}) {
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (pending) return;
    const prev = { supported, count };
    // Perbarui tampilan lebih dulu agar terasa cepat; dikembalikan bila server menolak.
    setError(null);
    setSupported(!supported);
    setCount(count + (supported ? -1 : 1));

    startTransition(async () => {
      try {
        const result = await toggleSupportAction({ reportId });
        if (!result.ok) {
          setSupported(prev.supported);
          setCount(prev.count);
          setError(result.error);
          return;
        }
        setSupported(result.supported);
        setCount(result.count);
      } catch {
        setSupported(prev.supported);
        setCount(prev.count);
        setError("Gagal menyimpan dukungan, coba lagi");
      }
    });
  }

  return (
    <div className={styles.supportWrap}>
      <button
        type="button"
        className={`${styles.support} ${supported ? styles.supportOn : ""}`}
        aria-pressed={supported}
        disabled={pending}
        onClick={onClick}
      >
        {supported && <Check size={14} aria-hidden />}
        {supported ? "Didukung" : "Bantu Laporan"}
        {count > 0 ? ` (${count})` : ""}
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

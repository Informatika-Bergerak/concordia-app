"use client";

import { useEffect, useId, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MAX_PRICE } from "@/modules/marketplace/constants";
import { formatRupiah, parseDigits } from "@/modules/marketplace/format";
import { ListingPhoto } from "./listing-photo";
import styles from "./marketplace.module.css";

export type OfferTarget = {
  title: string;
  price: number;
  location: string;
  photoUrl: string | null;
};

type Choice = "LOWER" | "ASKING" | "CUSTOM";

export function OfferSheet({ target, onClose }: { target: OfferTarget; onClose: () => void }) {
  const titleId = useId();
  const [choice, setChoice] = useState<Choice>("LOWER");
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentAmount, setSentAmount] = useState<number | null>(null);

  const lowerPrice = Math.round(target.price * 0.9);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function submit() {
    const amount = choice === "LOWER" ? lowerPrice : choice === "ASKING" ? target.price : parseDigits(custom);
    if (amount === null || amount <= 0) {
      setError("Masukkan nominal tawaran lebih dari 0.");
      return;
    }
    if (amount > MAX_PRICE) {
      setError("Nominal tawaran terlalu besar.");
      return;
    }
    setError(null);
    // TODO: panggil server action pembuatan tawaran saat backend Marketplace selesai.
    setSentAmount(amount);
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.sheetHeader}>
          <button type="button" className={styles.backBtn} onClick={onClose} aria-label="Tutup">
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <h2 id={titleId}>Tawaran Langsung</h2>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.offerSummary}>
            <ListingPhoto src={target.photoUrl} alt={`Foto ${target.title}`} className={styles.offerThumb} />
            <div>
              <p className={styles.offerTitle}>{target.title}</p>
              <p className={styles.offerMeta}>{formatRupiah(target.price)}</p>
              <p className={styles.offerMeta}>{target.location}</p>
            </div>
          </div>

          {sentAmount === null ? (
            <>
              <div className={styles.offerOptions} role="radiogroup" aria-label="Pilih nominal tawaran">
                <button type="button" role="radio" aria-checked={choice === "LOWER"} className={`${styles.offerOption} ${choice === "LOWER" ? styles.offerOptionActive : ""}`} onClick={() => setChoice("LOWER")}>
                  {formatRupiah(lowerPrice)} (10% lebih rendah)
                </button>
                <button type="button" role="radio" aria-checked={choice === "ASKING"} className={`${styles.offerOption} ${choice === "ASKING" ? styles.offerOptionActive : ""}`} onClick={() => setChoice("ASKING")}>
                  {formatRupiah(target.price)} (harga penjual)
                </button>
              </div>

              {choice === "CUSTOM" ? (
                <label className={styles.field}>
                  <span className={styles.label}>Nominal tawaran</span>
                  <input className={styles.input} inputMode="numeric" placeholder="Rp. 0" value={custom ? Number(custom).toLocaleString("id-ID") : ""} onChange={(event) => setCustom(event.target.value.replace(/\D/g, ""))} autoFocus />
                </label>
              ) : (
                <p className={styles.offerCustomLine}>
                  Tawar <button type="button" className={styles.linkBtn} onClick={() => setChoice("CUSTOM")}>harga berbeda</button>
                </p>
              )}

              {error && <p className={styles.error} role="alert">{error}</p>}

              <p className={styles.note}>Penawaran Anda bukanlah sebuah pembayaran. Detail pembelian akan diatur kemudian dengan penjual.</p>

              <button type="button" className={styles.primaryBtn} onClick={submit}>
                Kirim Tawaran
              </button>
            </>
          ) : (
            <div className={styles.offerDone} role="status">
              <p><strong>Tawaran {formatRupiah(sentAmount)} siap dikirim.</strong></p>
              <p className={styles.note}>Tampilan demo: pengiriman ke penjual aktif setelah backend Marketplace terhubung.</p>
              <button type="button" className={styles.primaryBtn} onClick={onClose}>Tutup</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

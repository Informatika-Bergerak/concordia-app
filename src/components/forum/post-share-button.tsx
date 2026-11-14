"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import styles from "./post-card.module.css";

export function PostShareButton({ postId, text }: { postId: number; text: string }) {
  const [notice, setNotice] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}/beranda/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Postingan ConCordia", text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setNotice("Tautan berhasil disalin");
      window.setTimeout(() => setNotice(null), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Gagal membagikan tautan");
      window.setTimeout(() => setNotice(null), 2200);
    }
  }

  return (
    <div className={styles.shareWrap}>
      <button type="button" className={styles.shareButton} onClick={share} aria-label="Bagikan postingan">
        <Share2 size={20} aria-hidden="true" /> Bagikan
      </button>
      {notice && <span className={styles.shareNotice} role="status">{notice}</span>}
    </div>
  );
}

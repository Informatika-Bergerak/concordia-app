"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import styles from "@/app/(user)/search/search.module.css";

const STORAGE_KEY = "concordia-search-history";

export function SearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter((item): item is string => typeof item === "string"));
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  function removeItem(term: string) {
    try {
      const updated = history.filter((item) => item !== term);
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  function clearAll() {
    try {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  if (history.length === 0) {
    return (
      <section className={styles.historySection} aria-labelledby="history-heading">
        <div className={styles.historyHeader}>
          <h2 id="history-heading">Pencarian Terbaru <span>&gt;</span></h2>
        </div>
        <p className={styles.empty}>Belum ada riwayat pencarian.</p>
      </section>
    );
  }

  return (
    <section className={styles.historySection} aria-labelledby="history-heading">
      <div className={styles.historyHeader}>
        <h2 id="history-heading">Pencarian Terbaru <span>&gt;</span></h2>
        <button type="button" className={styles.clearButton} onClick={clearAll}>Hapus semua</button>
      </div>
      <div className={styles.historyList}>
        {history.map((term) => (
          <div key={term} className={styles.historyRow}>
            <Link href={`/search?q=${encodeURIComponent(term)}`} className={styles.historyLink}>
              <Clock size={18} aria-hidden="true" />
              <span>{term}</span>
            </Link>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeItem(term)}
              aria-label={`Hapus ${term} dari riwayat`}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

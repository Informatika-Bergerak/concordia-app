"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORY_LABELS, STATUS_OPTIONS } from "@/modules/report/constants";
import type { ReportItem, ReportStatus } from "@/modules/report/types";
import { ReportCard } from "./report-card";
import styles from "./report.module.css";

export function ReportFeed({ reports }: { reports: ReportItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.title, r.description, r.location, CATEGORY_LABELS[r.category]].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
  }, [reports, query, status]);

  const mine = filtered.filter((r) => r.isMine);
  const latest = filtered.filter((r) => !r.isMine && r.visibility !== "PRIVATE");

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Masalah"
            aria-label="Cari masalah"
          />
        </label>
        <button
          type="button"
          className={styles.iconBtn}
          aria-pressed={showFilters}
          aria-label="Filter status laporan"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal size={22} aria-hidden />
        </button>
      </div>

      {showFilters && (
        <div className={styles.filters} role="group" aria-label="Filter status">
          <button type="button" className={styles.chip} aria-pressed={status === null} onClick={() => setStatus(null)}>
            Semua
          </button>
          {STATUS_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={styles.chip}
              aria-pressed={status === value}
              onClick={() => setStatus(status === value ? null : value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <section className={styles.section} aria-labelledby="laporan-saya">
        <h2 id="laporan-saya" className={styles.sectionHead}>Laporan Saya</h2>
        {mine.length === 0 ? (
          <p className={styles.empty}>Belum ada laporan.</p>
        ) : (
          <div className={styles.list}>
            {mine.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="laporan-terbaru">
        <h2 id="laporan-terbaru" className={styles.sectionHead}>Terbaru</h2>
        <p className={styles.sectionHint}>Bantu support laporan orang lain</p>
        {latest.length === 0 ? (
          <p className={styles.empty}>Tidak ada laporan yang cocok.</p>
        ) : (
          <div className={styles.list}>
            {latest.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}

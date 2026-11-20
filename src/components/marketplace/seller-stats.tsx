"use client";

import { useState } from "react";
import { AlertCircle, Bookmark, DollarSign, Eye, MessageCircle, Package, PackageX, Share2, Tag } from "lucide-react";
import type { InsightPeriod, InsightStats, SellerStats } from "@/modules/marketplace/seller-types";
import styles from "./seller.module.css";

const PERIOD_OPTIONS: { value: InsightPeriod; label: string }[] = [
  { value: 7, label: "7 Hari Terakhir" },
  { value: 30, label: "30 Hari Terakhir" },
  { value: 90, label: "90 Hari Terakhir" },
];

function formatCount(value: number) {
  return value.toLocaleString("id-ID");
}

export function WideStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <li className={styles.statCardWide}>
      <span className={styles.statIcon} aria-hidden="true">{icon}</span>
      <span className={`${styles.statBody} ${styles.statLabel}`}>{label}</span>
      <span className={styles.statValue}>{formatCount(value)}</span>
    </li>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <li className={styles.statCard}>
      <span className={styles.statTop}>
        <span className={styles.statIcon} aria-hidden="true">{icon}</span>
        <span className={styles.statValue}>{formatCount(value)}</span>
      </span>
      <span className={styles.statLabel}>{label}</span>
    </li>
  );
}

export function SellerSynopsis({ stats }: { stats: SellerStats }) {
  return (
    <>
      <h2 className={styles.sectionHeading}>Sinopsis</h2>
      <ul className={`${styles.statGrid} ${styles.statGridOne}`}>
        <WideStat icon={<MessageCircle size={22} />} label="Obrolan Yang Perlu Dijawab" value={stats.pendingChats} />
        <WideStat icon={<DollarSign size={22} />} label="Jumlah Penjualan" value={stats.totalSales} />
      </ul>

      <h2 className={styles.sectionHeading}>Tawaran Anda</h2>
      <ul className={`${styles.statGrid} ${styles.statGrid4}`}>
        <StatCard icon={<AlertCircle size={22} />} label="Perlu Perhatian" value={stats.needsAttention} />
        <StatCard icon={<Tag size={22} />} label="Produk Aktif" value={stats.activeCount} />
        <StatCard icon={<Package size={22} />} label="Produk Terjual" value={stats.soldCount} />
        <StatCard icon={<PackageX size={22} />} label="Produk Non Aktif/Habis" value={stats.inactiveCount} />
      </ul>
    </>
  );
}

type InsightProps = {
  data: Record<InsightPeriod, InsightStats>;
  heading?: string;
  /** Tampilkan deskripsi tiap angka (versi detail tawaran). */
  detailed?: boolean;
};

export function InsightPanel({ data, heading = "Insight Marketplace", detailed = false }: InsightProps) {
  const [period, setPeriod] = useState<InsightPeriod>(7);
  const stats = data[period];

  const rows = [
    { icon: <Eye size={22} />, label: "Mengklik Penjualan", value: stats.views, text: "Jumlah frekuensi orang melihat halaman detail barang anda." },
    { icon: <Tag size={22} />, label: "Tawaran Langsung", value: stats.directOffers, text: "Jumlah frekuensi orang menawar langsung barang anda." },
    { icon: <Bookmark size={22} />, label: "Tawaran Disimpan", value: stats.saved, text: "Jumlah frekuensi orang menyimpan tawaran barang anda." },
    { icon: <Share2 size={22} />, label: "Tawaran Dibagikan", value: stats.shared, text: "Jumlah frekuensi orang membagikan tawaran barang anda." },
  ];

  return (
    <>
      <div className={styles.insightHead}>
        <h2 className={styles.sectionHeading}>{heading}</h2>
        <select className={styles.periodSelect} value={period} onChange={(event) => setPeriod(Number(event.target.value) as InsightPeriod)} aria-label="Periode insight">
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {detailed ? (
        <ul className={`${styles.statGrid} ${styles.statGridOne}`}>
          {rows.map((row) => (
            <li key={row.label} className={styles.statCard}>
              <span className={styles.statTop}>
                <span className={styles.statIcon} aria-hidden="true">{row.icon}</span>
                <span className={styles.statValue}>{formatCount(row.value)}</span>
              </span>
              <span className={styles.statLabel}>{row.label}</span>
              <p className={styles.statDescription}>{row.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={`${styles.statGrid} ${styles.statGrid4}`}>
          {rows.map((row) => (
            <StatCard key={row.label} icon={row.icon} label={row.label} value={row.value} />
          ))}
        </ul>
      )}
    </>
  );
}

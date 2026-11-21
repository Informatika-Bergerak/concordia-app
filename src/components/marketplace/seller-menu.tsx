"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, Megaphone, MoreHorizontal, Search, Tag, TrendingUp } from "lucide-react";
import { AVAILABILITY_LABELS } from "@/modules/marketplace/constants";
import { formatDate, formatRupiah } from "@/modules/marketplace/format";
import type { Announcement, InsightPeriod, InsightStats, SellerListing, SellerStats } from "@/modules/marketplace/seller-types";
import { ListingPhoto } from "./listing-photo";
import { InsightPanel, SellerSynopsis } from "./seller-stats";
import base from "./marketplace.module.css";
import styles from "./seller.module.css";

type Tab = "dashboard" | "listings" | "announcements";

type Props = {
  listings: SellerListing[];
  stats: SellerStats;
  insight: Record<InsightPeriod, InsightStats>;
  announcements: Announcement[];
};

const TABS: { id: Tab; label: string; icon: typeof Tag }[] = [
  { id: "dashboard", label: "Dashbor Penjual", icon: TrendingUp },
  { id: "listings", label: "Tawaran Anda", icon: Tag },
  { id: "announcements", label: "Pengumuman", icon: Megaphone },
];

export function SellerMenu({ listings, stats, insight, announcements }: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeMap, setActiveMap] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(listings.map((item) => [item.id, item.active])),
  );

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      listings.filter(
        (item) => (q === "" || item.title.toLowerCase().includes(q)) && (!onlyActive || activeMap[item.id] !== false),
      ),
    [listings, q, onlyActive, activeMap],
  );

  function toggleActive(id: number) {
    // TODO: panggil server action aktif/non-aktifkan tawaran saat backend selesai.
    setActiveMap((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }

  return (
    <div className={base.page}>
      <div className={base.buyLayout}>
        <div className={base.buyHead}>
          <Link href="/marketplace" className={base.backBtn} aria-label="Kembali ke marketplace">
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
          <h1>Menu Jual</h1>
        </div>

        <div className={base.menuTabs} role="tablist" aria-label="Menu jual">
          <Link href="/marketplace/baru" className={base.primaryBtn}>+ Jual Barang</Link>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`sell-tab-${id}`}
              aria-selected={tab === id}
              aria-controls="sell-panel"
              className={`${base.menuTab} ${tab === id ? base.menuTabActive : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={20} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        <div className={base.buyContent} role="tabpanel" id="sell-panel" aria-labelledby={`sell-tab-${tab}`}>
          {tab === "dashboard" && (
            <>
              <SellerSynopsis stats={stats} />
              <InsightPanel data={insight} />
            </>
          )}

          {tab === "listings" && (
            <>
              <div className={base.searchBar}>
                <label className={base.searchField}>
                  <Search size={18} aria-hidden="true" />
                  <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Telusuri tawaran anda" aria-label="Telusuri tawaran anda" />
                </label>
                <button type="button" className={base.iconBtn} aria-label="Filter" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
                  <Filter size={16} aria-hidden="true" />
                </button>
              </div>
              {filterOpen && (
                <label className={base.check}>
                  <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} />
                  Hanya produk aktif
                </label>
              )}

              <h2 className={styles.sectionHeading}>Tawaran Anda</h2>
              {visible.length === 0 ? (
                <p className={base.empty}>
                  {listings.length === 0 ? "Anda belum memiliki tawaran." : "Tidak ada tawaran yang cocok."}{" "}
                  <Link href="/marketplace/baru" className={base.linkBtn}>Jual barang</Link>
                </p>
              ) : (
                <ul className={styles.sellerList}>
                  {visible.map((item) => {
                    const isActive = activeMap[item.id] !== false;
                    return (
                      <li key={item.id} className={styles.sellerItem}>
                        <Link href={`/marketplace/jual/${item.slug}`} className={styles.sellerItemMain}>
                          <ListingPhoto src={item.photoUrl} alt={`Foto ${item.title}`} className={base.historyThumb} />
                          <div className={base.historyBody}>
                            <p className={base.historyTitle}>{item.title}</p>
                            <p className={base.historyPrice}>{formatRupiah(item.price)}</p>
                            <p className={base.historyMeta}>Ditawarkan Tanggal {formatDate(item.postedAt)}</p>
                            <p className={base.historyMeta}>{AVAILABILITY_LABELS[item.availability]}</p>
                          </div>
                        </Link>
                        <div className={styles.sellerItemFoot}>
                          <span>{item.views} x Lihat</span>
                          <span className={styles.footActions}>
                            <Link href={`/marketplace/jual/${item.slug}`} className={styles.dotsBtn} aria-label={`Kelola ${item.title}`}>
                              <MoreHorizontal size={16} aria-hidden="true" />
                            </Link>
                            <button type="button" className={isActive ? styles.dangerTag : styles.activateTag} onClick={() => toggleActive(item.id)} aria-pressed={!isActive}>
                              {isActive ? "Non - Aktifkan Produk" : "Aktifkan Produk"}
                            </button>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {tab === "announcements" && (
            <>
              <h2 className={styles.sectionHeading}>Pengumuman Untuk Anda</h2>
              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <Megaphone size={72} aria-hidden="true" />
                  <p>Anda sudah melihat semuanya</p>
                </div>
              ) : (
                <ul className={base.historyList}>
                  {announcements.map((item) => (
                    <li key={item.id} className={`${base.historyItem} ${styles.notifItem}`}>
                      <span className={styles.notifThumb} aria-hidden="true" />
                      <div className={styles.notifBody}>
                        <p className={styles.notifTitle}>{item.title}</p>
                        <p className={styles.notifText}>{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

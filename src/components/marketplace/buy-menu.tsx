"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Clock, Filter, Megaphone, Search } from "lucide-react";
import { AVAILABILITY_LABELS } from "@/modules/marketplace/constants";
import { formatDate, formatRupiah } from "@/modules/marketplace/format";
import type { ActivityItem, NotificationItem } from "@/modules/marketplace/types";
import { ListingPhoto } from "./listing-photo";
import styles from "./marketplace.module.css";

type Tab = "activity" | "saved" | "notifications";

type Props = {
  offers: ActivityItem[];
  saved: ActivityItem[];
  notifications: NotificationItem[];
};

const TABS: { id: Tab; label: string; icon: typeof Clock }[] = [
  { id: "activity", label: "Aktivitas Terbaru", icon: Clock },
  { id: "saved", label: "Tersimpan", icon: Bookmark },
  { id: "notifications", label: "Pemberitahuan", icon: Megaphone },
];

export function BuyMenu({ offers, saved, notifications }: Props) {
  const [tab, setTab] = useState<Tab>("activity");
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = query.trim().toLowerCase();

  const items = useMemo(() => {
    const source = tab === "activity" ? offers : saved;
    return source.filter(
      (item) => (q === "" || item.title.toLowerCase().includes(q)) && (!onlyAvailable || item.availability !== "SOLD"),
    );
  }, [tab, offers, saved, q, onlyAvailable]);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => q === "" || item.text.toLowerCase().includes(q)),
    [notifications, q],
  );

  const placeholder = tab === "saved" ? "Telusuri tawaran yang Anda simpan" : tab === "activity" ? "Telusuri aktivitas Anda" : "Telusuri pemberitahuan";

  return (
    <div className={styles.page}>
      <div className={styles.buyLayout}>
        <div className={styles.buyHead}>
          <Link href="/marketplace" className={styles.backBtn} aria-label="Kembali ke marketplace">
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
          <h1>Menu Beli</h1>
        </div>

        <div className={styles.menuTabs} role="tablist" aria-label="Menu beli">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls="buy-panel"
              className={`${styles.menuTab} ${tab === id ? styles.menuTabActive : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={20} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        <div className={styles.buyContent} role="tabpanel" id="buy-panel" aria-labelledby={`tab-${tab}`}>
          <div className={styles.searchBar}>
            <label className={styles.searchField}>
              <Search size={18} aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
            </label>
            {tab !== "notifications" && (
              <button type="button" className={styles.iconBtn} aria-label="Filter" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
                <Filter size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {filterOpen && tab !== "notifications" && (
            <label className={styles.check}>
              <input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} />
              Hanya yang masih tersedia
            </label>
          )}

          {tab === "notifications" ? (
            visibleNotifications.length === 0 ? (
              <p className={styles.empty}>Belum ada pemberitahuan.</p>
            ) : (
              <ul className={styles.historyList}>
                {visibleNotifications.map((item) => (
                  <li key={item.id} className={styles.historyItem}>
                    <div className={styles.historyBody}>
                      <p className={styles.historyTitle}>{item.text}</p>
                      <p className={styles.historyMeta}>{formatDate(item.date)}</p>
                      {item.slug && <Link href={`/marketplace/${item.slug}`} className={styles.linkBtn}>Lihat tawaran</Link>}
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <>
              <h2 className={styles.historyHeading}>Riwayat</h2>
              {items.length === 0 ? (
                <p className={styles.empty}>
                  {tab === "saved" ? "Belum ada tawaran tersimpan." : "Belum ada aktivitas."} Telusuri marketplace untuk mulai.
                </p>
              ) : (
                <ul className={styles.historyList}>
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link href={`/marketplace/${item.slug}`} className={styles.historyItem}>
                        <ListingPhoto src={item.photoUrl} alt={`Foto ${item.title}`} className={styles.historyThumb} />
                        <div className={styles.historyBody}>
                          <p className={styles.historyTitle}>{item.title}</p>
                          <p className={styles.historyPrice}>{formatRupiah(item.price)}</p>
                          <p className={styles.historyMeta}>{item.action} Tanggal {formatDate(item.date)}</p>
                          <p className={styles.historyMeta}>{AVAILABILITY_LABELS[item.availability]}</p>
                        </div>
                      </Link>
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

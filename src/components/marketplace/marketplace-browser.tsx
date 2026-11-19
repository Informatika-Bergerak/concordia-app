"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Plus, Search, ShoppingCart } from "lucide-react";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from "@/modules/marketplace/constants";
import { parseDigits } from "@/modules/marketplace/format";
import type { ListingCategory, ListingCondition, ListingSummary } from "@/modules/marketplace/types";
import { ListingCard } from "./listing-card";
import styles from "./marketplace.module.css";

type Filters = {
  category: ListingCategory | "ALL";
  condition: ListingCondition | "ALL";
  min: string;
  max: string;
};

const EMPTY_FILTERS: Filters = { category: "ALL", condition: "ALL", min: "", max: "" };

export function MarketplaceBrowser({ listings }: { listings: ListingSummary[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  const activeFilterCount =
    (filters.category !== "ALL" ? 1 : 0) +
    (filters.condition !== "ALL" ? 1 : 0) +
    (filters.min !== "" ? 1 : 0) +
    (filters.max !== "" ? 1 : 0);
  const isFiltering = query.trim() !== "" || activeFilterCount > 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = parseDigits(filters.min);
    const max = parseDigits(filters.max);
    return listings.filter(
      (item) =>
        (q === "" || item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q)) &&
        (filters.category === "ALL" || item.category === filters.category) &&
        (filters.condition === "ALL" || item.condition === filters.condition) &&
        (min === null || item.price >= min) &&
        (max === null || item.price <= max),
    );
  }, [listings, query, filters]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className={styles.page}>
      <form className={styles.searchBar} role="search" onSubmit={(event) => event.preventDefault()}>
        <label className={styles.searchField}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Telusuri market place"
            aria-label="Telusuri market place"
          />
        </label>
        <button type="submit" className={styles.iconBtn} aria-label="Cari">
          <Search size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={activeFilterCount > 0 ? `Filter, ${activeFilterCount} aktif` : "Filter"}
          aria-expanded={panelOpen}
          aria-controls="marketplace-filter"
          onClick={() => setPanelOpen((open) => !open)}
        >
          <Filter size={16} aria-hidden="true" />
        </button>
      </form>

      {panelOpen && (
        <div id="marketplace-filter" className={styles.filterPanel}>
          <label className={styles.filterField}>
            <span>Kategori</span>
            <select className={styles.select} value={filters.category} onChange={(event) => updateFilter("category", event.target.value as Filters["category"])}>
              <option value="ALL">Semua kategori</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Kondisi</span>
            <select className={styles.select} value={filters.condition} onChange={(event) => updateFilter("condition", event.target.value as Filters["condition"])}>
              <option value="ALL">Semua kondisi</option>
              {CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Harga minimum</span>
            <input className={styles.input} inputMode="numeric" placeholder="Rp. 0" value={filters.min} onChange={(event) => updateFilter("min", event.target.value.replace(/\D/g, ""))} />
          </label>
          <label className={styles.filterField}>
            <span>Harga maksimum</span>
            <input className={styles.input} inputMode="numeric" placeholder="Tanpa batas" value={filters.max} onChange={(event) => updateFilter("max", event.target.value.replace(/\D/g, ""))} />
          </label>
          <button type="button" className={styles.linkBtn} onClick={() => setFilters(EMPTY_FILTERS)} disabled={activeFilterCount === 0}>
            Reset filter
          </button>
        </div>
      )}

      <h1 className={styles.sectionTitle}>{isFiltering ? `Hasil penelusuran (${visible.length})` : "Rekomendasi Hari Ini"}</h1>

      {visible.length === 0 ? (
        <p className={styles.empty}>Tidak ada penawaran yang cocok. Ubah kata kunci atau filter.</p>
      ) : (
        <ul className={styles.grid}>
          {visible.map((item) => (
            <li key={item.id}>
              <ListingCard listing={item} />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.fabGroup}>
        <Link href="/marketplace/beli" className={styles.fab} aria-label="Menu beli">
          <ShoppingCart size={24} aria-hidden="true" />
        </Link>
        <Link href="/marketplace/baru" className={styles.fab} aria-label="Tawarkan barang">
          <Plus size={26} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "@/app/(user)/search/search.module.css";

const STORAGE_KEY = "concordia-search-history";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      const updated = [trimmed, ...parsed.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors (private mode / blocked)
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search" autoComplete="off">
      <Search size={25} aria-hidden="true" />
      <input
        id="search-query"
        name="q"
        aria-label="Cari postingan atau orang"
        type="search"
        placeholder="Cari...."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={80}
      />
      <button className={styles.submit} type="submit" aria-label="Jalankan pencarian">
        <Search size={22} aria-hidden="true" />
      </button>
    </form>
  );
}

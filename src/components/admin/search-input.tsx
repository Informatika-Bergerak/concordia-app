"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import styles from "./admin.module.css";

interface Props {
  placeholder?: string;
  paramName?: string;
}

export function SearchInput({
  placeholder = "Cari username atau nama...",
  paramName = "q",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
  }

  return (
    <input
      type="search"
      defaultValue={searchParams.get(paramName) ?? ""}
      onChange={handleChange}
      placeholder={placeholder}
      className={styles.searchInput}
      maxLength={64}
    />
  );
}

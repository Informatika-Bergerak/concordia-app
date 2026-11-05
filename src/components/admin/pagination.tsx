"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./admin.module.css";

interface Props {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", String(newPage));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        Halaman {page} dari {totalPages} ({total} akun)
      </span>
      <div className={styles.pageLinks}>
        {page > 1 ? (
          <Link href={buildUrl(page - 1)} className={styles.pageLink}>
            Sebelumnya
          </Link>
        ) : (
          <span className={styles.pageLinkDisabled}>Sebelumnya</span>
        )}
        {page < totalPages ? (
          <Link href={buildUrl(page + 1)} className={styles.pageLink}>
            Berikutnya
          </Link>
        ) : (
          <span className={styles.pageLinkDisabled}>Berikutnya</span>
        )}
      </div>
    </div>
  );
}

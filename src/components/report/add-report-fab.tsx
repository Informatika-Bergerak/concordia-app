import Link from "next/link";
import styles from "./report.module.css";

// Ikon gelembung percakapan dengan tanda plus sesuai desain Figma.
export function AddReportFab() {
  return (
    <div className={styles.fabDock}>
      <Link
        href="/laporan/baru"
        className={styles.fab}
        aria-label="Buat laporan masalah baru"
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path
            fill="currentColor"
            d="M32 4C16.5 4 4 15.2 4 29c0 6.1 2.4 11.7 6.5 16L7 58l13.4-5.6C23.8 53.4 27.8 54 32 54c15.5 0 28-11.2 28-25S47.5 4 32 4Z"
          />
          <path
            fill="#fff"
            d="M29 16h6v10.5H45.5v6H35V43h-6V32.5H18.5v-6H29V16Z"
          />
        </svg>
      </Link>
    </div>
  );
}

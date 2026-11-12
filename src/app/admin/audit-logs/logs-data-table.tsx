"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Filter,
  Clock,
  User,
  Globe,
  Laptop,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  LogOut,
  KeyRound,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { AuditAction } from "@/generated/prisma/enums";
import { auditLabels } from "@/lib/audit/labels";
import styles from "./logs.module.css";

export interface SerializedAuditLog {
  id: number;
  createdAt: string;
  action: AuditAction;
  actorId: number | null;
  actorUsername: string | null;
  targetId: number | null;
  targetUsername: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
}

interface LogsDataTableProps {
  logs: SerializedAuditLog[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  currentAction: string;
  currentQuery: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const ACTION_OPTIONS: Array<{ value: AuditAction; label: string }> = [
  { value: "LOGIN_SUCCESS", label: auditLabels.LOGIN_SUCCESS },
  { value: "LOGIN_FAILED", label: auditLabels.LOGIN_FAILED },
  { value: "LOGIN_LOCKED", label: auditLabels.LOGIN_LOCKED },
  { value: "LOGIN_DEVICE_REJECTED", label: auditLabels.LOGIN_DEVICE_REJECTED },
  { value: "LOGOUT", label: auditLabels.LOGOUT },
  { value: "PASSWORD_CHANGED", label: auditLabels.PASSWORD_CHANGED },
  { value: "PASSWORD_RESET", label: auditLabels.PASSWORD_RESET },
  { value: "ACCOUNT_CREATED", label: auditLabels.ACCOUNT_CREATED },
  { value: "ACCOUNT_ACTIVATED", label: auditLabels.ACCOUNT_ACTIVATED },
  { value: "ACCOUNT_DEACTIVATED", label: auditLabels.ACCOUNT_DEACTIVATED },
  { value: "SESSION_REVOKED", label: auditLabels.SESSION_REVOKED },
];

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function renderSafeMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;

  if (typeof m.accountType === "string") {
    return `Tipe: ${m.accountType}`;
  }
  if (m.reason === "unknown_username") {
    return "Username tidak terdaftar";
  }
  return null;
}

function ActionBadge({ action }: { action: AuditAction }) {
  const label = auditLabels[action] ?? action;

  switch (action) {
    case "LOGIN_SUCCESS":
      return (
        <span className={`${styles.badge} ${styles.badgeSuccess}`}>
          <LogIn size={13} />
          {label}
        </span>
      );
    case "LOGIN_FAILED":
    case "LOGIN_LOCKED":
    case "ACCOUNT_DEACTIVATED":
    case "SESSION_REVOKED":
      return (
        <span className={`${styles.badge} ${styles.badgeDanger}`}>
          <ShieldAlert size={13} />
          {label}
        </span>
      );
    case "LOGIN_DEVICE_REJECTED":
      return (
        <span className={`${styles.badge} ${styles.badgeWarning}`}>
          <Laptop size={13} />
          {label}
        </span>
      );
    case "LOGOUT":
      return (
        <span className={`${styles.badge} ${styles.badgeNeutral}`}>
          <LogOut size={13} />
          {label}
        </span>
      );
    case "PASSWORD_CHANGED":
    case "ACCOUNT_ACTIVATED":
      return (
        <span className={`${styles.badge} ${styles.badgeSuccess}`}>
          <ShieldCheck size={13} />
          {label}
        </span>
      );
    case "PASSWORD_RESET":
      return (
        <span className={`${styles.badge} ${styles.badgeInfo}`}>
          <RotateCcw size={13} />
          {label}
        </span>
      );
    case "ACCOUNT_CREATED":
      return (
        <span className={`${styles.badge} ${styles.badgeInfo}`}>
          <User size={13} />
          {label}
        </span>
      );
    default:
      return <span className={styles.badge}>{label}</span>;
  }
}

/**
 * Menghasilkan susunan nomor halaman untuk pagination mirip DataTables:
 * contoh: [1, 2, 3, 4, 5, '...', 10]
 */
function getPaginationItems(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function LogsDataTable({
  logs,
  total,
  totalPages,
  currentPage,
  pageSize,
  currentAction,
  currentQuery,
}: LogsDataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [selectedAction, setSelectedAction] = useState(currentAction);
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);

  // Sinkronisasi jika URL searchParams berubah dari riwayat browser
  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    setSelectedAction(currentAction);
  }, [currentAction]);

  useEffect(() => {
    setSelectedPageSize(pageSize);
  }, [pageSize]);

  // Fungsi helper update URL
  const updateUrl = (opts: {
    q?: string;
    action?: string;
    size?: number;
    page?: number;
  }) => {
    const q = opts.q !== undefined ? opts.q : searchQuery;
    const action = opts.action !== undefined ? opts.action : selectedAction;
    const size = opts.size !== undefined ? opts.size : selectedPageSize;
    const page = opts.page !== undefined ? opts.page : 1;

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (size !== 10) params.set("pageSize", String(size));
    if (q.trim()) params.set("q", q.trim());
    if (action) params.set("action", action);

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs");
    });
  };

  // Filter realtime dengan debounce 300ms untuk input pencarian teks
  useEffect(() => {
    if (searchQuery === currentQuery) return;

    const timer = setTimeout(() => {
      updateUrl({ q: searchQuery, page: 1 });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentQuery]);

  // Handler dropdown filter aksi (langsung dieksekusi secara realtime)
  const handleActionChange = (actionValue: string) => {
    setSelectedAction(actionValue);
    updateUrl({ action: actionValue, page: 1 });
  };

  // Handler Show entries (10, 25, 50, 100) langsung dieksekusi secara realtime
  const handlePageSizeChange = (newSize: number) => {
    setSelectedPageSize(newSize);
    updateUrl({ size: newSize, page: 1 });
  };

  // Handler navigasi halaman
  const handlePageClick = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    updateUrl({ page: pageNumber });
  };

  // Handler reset filter
  const handleReset = () => {
    setSearchQuery("");
    setSelectedAction("");
    setSelectedPageSize(10);
    startTransition(() => {
      router.replace("/admin/audit-logs");
    });
  };

  // Hitung rentang data yang ditampilkan (misal: "Showing 1 to 10 of 57 entries")
  const fromIndex = total === 0 ? 0 : (currentPage - 1) * selectedPageSize + 1;
  const toIndex = Math.min(currentPage * selectedPageSize, total);

  const paginationItems = getPaginationItems(currentPage, totalPages);
  const hasActiveFilters = Boolean(searchQuery.trim() || selectedAction || selectedPageSize !== 10);

  return (
    <div className={styles.dataTableCard}>
      {/* Top Controls Bar: Show entries di kiri, Search & Filter di kanan */}
      <div className={styles.dtHeader}>
        {/* Kontrol Show Entries (seperti pada foto rujukan DataTables) */}
        <div className={styles.dtLength}>
          <label className={styles.dtLengthLabel}>
            Show
            <select
              value={selectedPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={styles.dtLengthSelect}
              aria-label="Pilih jumlah data per halaman"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            entries
          </label>

          {/* Filter Aksi Realtime */}
          <div className={styles.dtFilterBox}>
            <Filter size={14} className={styles.filterIcon} />
            <select
              value={selectedAction}
              onChange={(e) => handleActionChange(e.target.value)}
              className={styles.dtFilterSelect}
              aria-label="Filter berdasarkan aksi"
            >
              <option value="">Semua Aksi</option>
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className={styles.dtResetBtn}
              title="Reset semua filter ke default"
            >
              Reset
            </button>
          )}
        </div>

        {/* Kontrol Search Realtime (seperti pada foto rujukan DataTables) */}
        <div className={styles.dtSearch}>
          <label className={styles.dtSearchLabel}>
            Search:
            <div className={styles.dtSearchInputWrapper}>
              <Search size={14} className={styles.dtSearchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama..."
                className={styles.dtSearchInput}
                maxLength={64}
                aria-label="Cari data log"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={styles.dtSearchClear}
                  title="Hapus teks"
                  aria-label="Hapus teks"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </label>

          {/* Indikator Loading Realtime */}
          {isPending && (
            <div className={styles.dtLoadingBadge}>
              <Loader2 size={13} className={styles.dtSpinner} />
            </div>
          )}
        </div>
      </div>

      {/* Loading Bar Halus Saat Realtime Filter Berjalan */}
      {isPending && <div className={styles.dtProgressBar} />}

      {/* Kontainer Tabel — Tidak ada isi yang terpotong */}
      <div className={`${styles.dtTableWrapper} ${isPending ? styles.dtPending : ""}`}>
        {logs.length === 0 ? (
          <div className={styles.dtEmpty}>
            <div className={styles.dtEmptyIcon}>
              <ShieldAlert size={32} />
            </div>
            <p className={styles.dtEmptyTitle}>Tidak ada data log yang ditemukan</p>
            <p className={styles.dtEmptySub}>
              {hasActiveFilters
                ? "Coba ubah kata kunci pencarian atau ganti filter aksi."
                : "Belum ada catatan aktivitas yang tersimpan di sistem."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className={styles.dtEmptyResetBtn}
              >
                Kembalikan Filter
              </button>
            )}
          </div>
        ) : (
          <table className={styles.dtTable}>
            <thead>
              <tr>
                <th style={{ width: "18%" }}>
                  <span className={styles.thInner}>
                    <Clock size={13} />
                    Waktu
                  </span>
                </th>
                <th style={{ width: "20%" }}>
                  <span className={styles.thInner}>
                    <ShieldCheck size={13} />
                    Aksi
                  </span>
                </th>
                <th style={{ width: "14%" }}>
                  <span className={styles.thInner}>
                    <User size={13} />
                    Pelaku
                  </span>
                </th>
                <th style={{ width: "14%" }}>
                  <span className={styles.thInner}>
                    <User size={13} />
                    Target
                  </span>
                </th>
                <th style={{ width: "14%" }}>
                  <span className={styles.thInner}>
                    <Globe size={13} />
                    IP
                  </span>
                </th>
                <th style={{ width: "20%" }}>
                  <span className={styles.thInner}>
                    <Laptop size={13} />
                    Perangkat
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const metaText = renderSafeMetadata(log.metadata);

                return (
                  <tr key={log.id} className={styles.dtRow}>
                    {/* Waktu (Lengkap, tidak terpotong) */}
                    <td className={styles.dtCellTime}>
                      {formatDate(log.createdAt)}
                    </td>

                    {/* Aksi & Metadata */}
                    <td className={styles.dtCellAction}>
                      <ActionBadge action={log.action} />
                      {metaText && (
                        <span className={styles.dtMetaBadge}>{metaText}</span>
                      )}
                    </td>

                    {/* Pelaku (Lengkap, tidak terpotong) */}
                    <td className={styles.dtCellUser}>
                      {log.actorUsername ? (
                        <span className={styles.dtUserPill}>
                          <User size={12} />
                          {log.actorUsername}
                        </span>
                      ) : (
                        <span className={styles.dtDash}>-</span>
                      )}
                    </td>

                    {/* Target (Lengkap, tidak terpotong) */}
                    <td className={styles.dtCellUser}>
                      {log.targetUsername ? (
                        <span className={styles.dtUserPill}>
                          <User size={12} />
                          {log.targetUsername}
                        </span>
                      ) : (
                        <span className={styles.dtDash}>-</span>
                      )}
                    </td>

                    {/* IP (Lengkap, tidak terpotong) */}
                    <td className={styles.dtCellIp}>
                      {log.ip ? (
                        <code className={styles.dtIpCode}>{log.ip}</code>
                      ) : (
                        <span className={styles.dtDash}>-</span>
                      )}
                    </td>

                    {/* Perangkat (Teks lengkap, membungkus rapi, TIDAK terpotong) */}
                    <td className={styles.dtCellDevice}>
                      <span className={styles.dtDeviceText}>
                        {log.userAgent ?? "Perangkat tidak dikenal"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Bar: "Showing 1 to 10 of 57 entries" di kiri, Pagination di kanan (sesuai foto rujukan) */}
      <div className={styles.dtFooter}>
        <div className={styles.dtInfo}>
          Showing {fromIndex} to {toIndex} of {total} entries
        </div>

        <div className={styles.dtPagination}>
          {/* Tombol Previous */}
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className={`${styles.dtPageBtn} ${styles.dtNavBtn}`}
            aria-label="Previous Page"
          >
            Previous
          </button>

          {/* Tombol Nomor Halaman ([1] [2] ... aktif biru seperti pada foto) */}
          {paginationItems.map((item, idx) => {
            if (item === "...") {
              return (
                <span key={`ellipsis-${idx}`} className={styles.dtPageEllipsis}>
                  ...
                </span>
              );
            }

            const pageNum = Number(item);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => handlePageClick(pageNum)}
                disabled={isPending || isActive}
                className={`${styles.dtPageBtn} ${isActive ? styles.dtPageActive : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Tombol Next */}
          <button
            type="button"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className={`${styles.dtPageBtn} ${styles.dtNavBtn}`}
            aria-label="Next Page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Filter,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Loader2,
} from "lucide-react";
import type { Role, UserType } from "@/generated/prisma/enums";
import styles from "./admin-data-table.module.css";

export interface SerializedAdminUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  userType: UserType | null;
  createdAt: string;
}

interface AdminUsersDataTableProps {
  users: SerializedAdminUser[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  currentRole: string;
  currentQuery: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MODERATOR", label: "Moderator" },
  { value: "DOSEN", label: "Dosen" },
  { value: "MAHASISWA", label: "Mahasiswa" },
];

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function RoleBadge({ role, userType }: { role: Role; userType: UserType | null }) {
  if (role === "ADMIN") {
    return (
      <span className={`${styles.badge} ${styles.badgeDanger}`}>
        <ShieldCheck size={13} />
        Admin
      </span>
    );
  }
  if (role === "MODERATOR") {
    return (
      <span className={`${styles.badge} ${styles.badgeWarning}`}>
        <ShieldAlert size={13} />
        Moderator
      </span>
    );
  }
  if (userType === "DOSEN") {
    return (
      <span className={`${styles.badge} ${styles.badgeInfo}`}>
        <UserCheck size={13} />
        Dosen
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeNeutral}`}>
      <User size={13} />
      Mahasiswa
    </span>
  );
}

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

export function AdminUsersDataTable({
  users,
  total,
  totalPages,
  currentPage,
  pageSize,
  currentRole,
  currentQuery,
}: AdminUsersDataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    setSelectedPageSize(pageSize);
  }, [pageSize]);

  const updateUrl = (opts: {
    q?: string;
    role?: string;
    size?: number;
    page?: number;
  }) => {
    const q = opts.q !== undefined ? opts.q : searchQuery;
    const role = opts.role !== undefined ? opts.role : selectedRole;
    const size = opts.size !== undefined ? opts.size : selectedPageSize;
    const page = opts.page !== undefined ? opts.page : 1;

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (size !== 10) params.set("pageSize", String(size));
    if (q.trim()) params.set("q", q.trim());
    if (role) params.set("role", role);

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/admin?${qs}` : "/admin");
    });
  };

  useEffect(() => {
    if (searchQuery === currentQuery) return;

    const timer = setTimeout(() => {
      updateUrl({ q: searchQuery, page: 1 });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentQuery]);

  const handleRoleChange = (roleValue: string) => {
    setSelectedRole(roleValue);
    updateUrl({ role: roleValue, page: 1 });
  };

  const handlePageSizeChange = (newSize: number) => {
    setSelectedPageSize(newSize);
    updateUrl({ size: newSize, page: 1 });
  };

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    updateUrl({ page: pageNumber });
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRole("");
    setSelectedPageSize(10);
    startTransition(() => {
      router.replace("/admin");
    });
  };

  const fromIndex = total === 0 ? 0 : (currentPage - 1) * selectedPageSize + 1;
  const toIndex = Math.min(currentPage * selectedPageSize, total);

  const paginationItems = getPaginationItems(currentPage, totalPages);
  const hasActiveFilters = Boolean(searchQuery.trim() || selectedRole || selectedPageSize !== 10);

  return (
    <div className={styles.dataTableCard}>
      {/* Top Controls Bar */}
      <div className={styles.dtHeader}>
        {/* Show entries selector */}
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

          {/* Filter Role */}
          <div className={styles.dtFilterBox}>
            <Filter size={14} className={styles.filterIcon} />
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className={styles.dtFilterSelect}
              aria-label="Filter berdasarkan role"
            >
              <option value="">Semua Role</option>
              {ROLE_OPTIONS.map((opt) => (
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
              title="Reset semua filter"
            >
              Reset
            </button>
          )}
        </div>

        {/* Realtime Search Box */}
        <div className={styles.dtSearch}>
          <label className={styles.dtSearchLabel}>
            Search:
            <div className={styles.dtSearchInputWrapper}>
              <Search size={14} className={styles.dtSearchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari username atau nama..."
                className={styles.dtSearchInput}
                maxLength={64}
                aria-label="Cari pengguna"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={styles.dtSearchClear}
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </label>

          {isPending && (
            <div className={styles.dtLoadingBadge}>
              <Loader2 size={13} className={styles.dtSpinner} />
            </div>
          )}
        </div>
      </div>

      {isPending && <div className={styles.dtProgressBar} />}

      {/* Table Content */}
      <div className={`${styles.dtTableWrapper} ${isPending ? styles.dtPending : ""}`}>
        {users.length === 0 ? (
          <div className={styles.dtEmpty}>
            <div className={styles.dtEmptyIcon}>
              <User size={32} />
            </div>
            <p className={styles.dtEmptyTitle}>Tidak ada akun ditemukan</p>
            <p className={styles.dtEmptySub}>
              {hasActiveFilters
                ? "Coba ubah kata kunci pencarian atau ganti filter role."
                : "Belum ada data pengguna yang tersimpan di sistem."}
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
                <th style={{ width: "25%" }}>
                  <span className={styles.thInner}>
                    <User size={13} />
                    Username
                  </span>
                </th>
                <th style={{ width: "35%" }}>
                  <span className={styles.thInner}>
                    <User size={13} />
                    Nama Lengkap
                  </span>
                </th>
                <th style={{ width: "20%" }}>
                  <span className={styles.thInner}>
                    <ShieldCheck size={13} />
                    Role
                  </span>
                </th>
                <th style={{ width: "20%" }}>
                  <span className={styles.thInner}>
                    <Clock size={13} />
                    Dibuat
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={styles.dtRow}>
                  <td className={styles.dtCellUser}>
                    <span className={styles.dtUserPill}>
                      <User size={12} />
                      {u.username}
                    </span>
                  </td>
                  <td className={styles.dtCellName}>{u.name}</td>
                  <td>
                    <RoleBadge role={u.role} userType={u.userType} />
                  </td>
                  <td className={styles.dtCellTime}>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Bar: "Showing X to Y of Z entries" & Pagination Buttons */}
      <div className={styles.dtFooter}>
        <div className={styles.dtInfo}>
          Showing {fromIndex} to {toIndex} of {total} entries
        </div>

        <div className={styles.dtPagination}>
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className={`${styles.dtPageBtn} ${styles.dtNavBtn}`}
            aria-label="Previous Page"
          >
            Previous
          </button>

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


import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { toggleActiveAction } from "./actions";
import { CreateUserForm } from "./create-user-form";
import { ResetPasswordButton } from "./reset-password-button";
import { SearchInput } from "@/components/admin/search-input";
import { Pagination } from "@/components/admin/pagination";
import styles from "@/components/admin/admin.module.css";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    qStaf?: string;   pageStaf?: string;
    qMhs?: string;    pageMhs?: string;
    qDosen?: string;  pageDosen?: string;
  }>;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function safeQuery(q: string | undefined) {
  return q ? q.slice(0, 64) : undefined;
}

function searchWhere(q: string | undefined) {
  const s = safeQuery(q);
  if (!s) return {};
  return {
    OR: [
      { username: { contains: s, mode: "insensitive" as const } },
      { name: { contains: s, mode: "insensitive" as const } },
    ],
  };
}

function typeLabel(role: string, userType: string | null) {
  if (role === "ADMIN") return { text: "Admin", cls: "badge badge-admin" };
  if (role === "MODERATOR") return { text: "Moderator", cls: "badge badge-moderator" };
  if (userType === "DOSEN") return { text: "Dosen", cls: "badge badge-dosen" };
  return { text: "Mahasiswa", cls: "badge" };
}

type UserRow = {
  id: number;
  username: string;
  name: string;
  role: string;
  userType: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
};

function UserTable({
  users,
  adminId,
  colSpan = 5,
}: {
  users: UserRow[];
  adminId: number;
  colSpan?: number;
}) {
  if (users.length === 0) {
    return (
      <div className="table-wrap">
        <table>
          <tbody>
            <tr>
              <td
                colSpan={colSpan}
                style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}
              >
                Tidak ada akun ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Nama</th>
            <th>Role</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const t = typeLabel(u.role, u.userType);
            return (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td><span className={t.cls}>{t.text}</span></td>
                <td>
                  <span className={u.isActive ? "badge badge-dosen" : "badge badge-off"}>
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  {u.mustChangePassword && (
                    <span className="badge badge-moderator" style={{ marginLeft: 6 }}>
                      Belum ganti password
                    </span>
                  )}
                </td>
                <td>
                  <div className="actions-cell">
                    <ResetPasswordButton userId={u.id} username={u.username} />
                    <form action={toggleActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button
                        type="submit"
                        className="btn btn-ghost"
                        disabled={u.id === adminId}
                      >
                        {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const SELECT = {
  id: true,
  username: true,
  name: true,
  role: true,
  userType: true,
  isActive: true,
  mustChangePassword: true,
} as const;

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { user: admin } = await requireRole(["ADMIN"]);
  const sp = await searchParams;

  const pageStaf  = parsePage(sp.pageStaf);
  const pageMhs   = parsePage(sp.pageMhs);
  const pageDosen = parsePage(sp.pageDosen);

  const whereStaf  = { ...searchWhere(sp.qStaf),  role: { in: ["ADMIN", "MODERATOR"] as ("ADMIN" | "MODERATOR")[] } };
  const whereMhs   = { ...searchWhere(sp.qMhs),   role: "USER" as const, userType: "MAHASISWA" as const };
  const whereDosen = { ...searchWhere(sp.qDosen),  role: "USER" as const, userType: "DOSEN" as const };

  const [
    stafUsers,  stafTotal,
    mhsUsers,   mhsTotal,
    dosenUsers, dosenTotal,
  ] = await Promise.all([
    prisma.user.findMany({ where: whereStaf,  orderBy: [{ role: "desc" }, { name: "asc" }], skip: (pageStaf  - 1) * PAGE_SIZE, take: PAGE_SIZE, select: SELECT }),
    prisma.user.count({ where: whereStaf }),
    prisma.user.findMany({ where: whereMhs,   orderBy: { name: "asc" }, skip: (pageMhs   - 1) * PAGE_SIZE, take: PAGE_SIZE, select: SELECT }),
    prisma.user.count({ where: whereMhs }),
    prisma.user.findMany({ where: whereDosen, orderBy: { name: "asc" }, skip: (pageDosen - 1) * PAGE_SIZE, take: PAGE_SIZE, select: SELECT }),
    prisma.user.count({ where: whereDosen }),
  ]);

  const totalPagesStaf  = Math.max(1, Math.ceil(stafTotal  / PAGE_SIZE));
  const totalPagesMhs   = Math.max(1, Math.ceil(mhsTotal   / PAGE_SIZE));
  const totalPagesDosen = Math.max(1, Math.ceil(dosenTotal / PAGE_SIZE));

  return (
    <AppShell user={admin}>
      <h1 className="page-title">Kelola Akun</h1>
      <p className="page-sub">Buat akun, reset password, dan aktifkan atau nonaktifkan pengguna.</p>

      <CreateUserForm />

      {/* Admin & Moderator */}
      <section className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <h2 className={styles.tableSectionTitle}>Admin &amp; Moderator</h2>
          <span className={styles.tableSectionCount}>{stafTotal} akun</span>
        </div>
        <div className={styles.searchBar}>
          <SearchInput paramName="qStaf" pageParamName="pageStaf" placeholder="Cari username atau nama..." />
        </div>
        <UserTable users={stafUsers} adminId={admin.id} />
        <Pagination page={pageStaf} totalPages={totalPagesStaf} total={stafTotal} pageParamName="pageStaf" />
      </section>

      {/* Mahasiswa */}
      <section className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <h2 className={styles.tableSectionTitle}>Mahasiswa</h2>
          <span className={styles.tableSectionCount}>{mhsTotal} akun</span>
        </div>
        <div className={styles.searchBar}>
          <SearchInput paramName="qMhs" pageParamName="pageMhs" placeholder="Cari username atau nama..." />
        </div>
        <UserTable users={mhsUsers} adminId={admin.id} />
        <Pagination page={pageMhs} totalPages={totalPagesMhs} total={mhsTotal} pageParamName="pageMhs" />
      </section>

      {/* Dosen */}
      <section className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <h2 className={styles.tableSectionTitle}>Dosen</h2>
          <span className={styles.tableSectionCount}>{dosenTotal} akun</span>
        </div>
        <div className={styles.searchBar}>
          <SearchInput paramName="qDosen" pageParamName="pageDosen" placeholder="Cari username atau nama..." />
        </div>
        <UserTable users={dosenUsers} adminId={admin.id} />
        <Pagination page={pageDosen} totalPages={totalPagesDosen} total={dosenTotal} pageParamName="pageDosen" />
      </section>
    </AppShell>
  );
}

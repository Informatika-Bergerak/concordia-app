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
  searchParams: Promise<{ q?: string; page?: string }>;
}

function typeLabel(role: string, userType: string | null) {
  if (role === "ADMIN") return { text: "Admin", cls: "badge badge-admin" };
  if (role === "MODERATOR") return { text: "Moderator", cls: "badge badge-moderator" };
  if (userType === "DOSEN") return { text: "Dosen", cls: "badge badge-dosen" };
  return { text: "Mahasiswa", cls: "badge" };
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { user: admin } = await requireRole(["ADMIN"]);

  const { q, page: pageParam } = await searchParams;
  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const skip = (page - 1) * PAGE_SIZE;
  const safeQ = q ? q.slice(0, 64) : undefined;

  const where = safeQ
    ? {
        OR: [
          { username: { contains: safeQ, mode: "insensitive" as const } },
          { name: { contains: safeQ, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "desc" }, { name: "asc" }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        userType: true,
        isActive: true,
        mustChangePassword: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell user={admin}>
      <h1 className="page-title">Kelola Akun</h1>
      <p className="page-sub">Buat akun, reset password, dan aktifkan atau nonaktifkan pengguna.</p>

      <CreateUserForm />

      <div className={styles.searchBar}>
        <SearchInput placeholder="Cari username atau nama..." />
      </div>

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
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                  Tidak ada akun ditemukan.
                </td>
              </tr>
            ) : (
              users.map((u) => {
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
                            disabled={u.id === admin.id}
                          >
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </AppShell>
  );
}

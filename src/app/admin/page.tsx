import { AppShell } from "@/components/app-shell";
import { requireRole } from "../../lib/auth/guards";
import { prisma } from "@/lib/db";
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

export default async function AdminPage({ searchParams }: PageProps) {
  const session = await requireRole(["ADMIN"]);

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

  const [totalAll, mahasiswaCount, dosenCount, stafCount, users, total] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "USER", userType: "MAHASISWA" } }),
      prisma.user.count({ where: { role: "USER", userType: "DOSEN" } }),
      prisma.user.count({ where: { role: { not: "USER" } } }),
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
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = [
    { label: "Total akun", num: totalAll },
    { label: "Mahasiswa", num: mahasiswaCount },
    { label: "Dosen", num: dosenCount },
    { label: "Admin & moderator", num: stafCount },
  ];

  return (
    <AppShell user={session.user}>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Ringkasan data pengguna ConCordia.</p>

      <div className="grid">
        {stats.map((s) => (
          <div className="card stat" key={s.label}>
            <div className="num">{s.num}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

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
              <th>Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
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
                    <td>{u.createdAt.toLocaleDateString("id-ID")}</td>
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

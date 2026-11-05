import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { AdminUsersDataTable, type SerializedAdminUser } from "./admin-users-data-table";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    role?: string;
  }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const session = await requireRole(["ADMIN"]);

  const { q, page: pageParam, pageSize: sizeParam, role: roleParam } = await searchParams;
  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawSize = Number(sizeParam);
  const pageSize = [10, 25, 50, 100].includes(rawSize) ? rawSize : 10;
  const skip = (page - 1) * pageSize;

  const safeQ = q ? q.slice(0, 64) : undefined;
  const selectedRole = roleParam ?? "";

  let roleFilter = {};
  if (selectedRole === "ADMIN") {
    roleFilter = { role: "ADMIN" };
  } else if (selectedRole === "MODERATOR") {
    roleFilter = { role: "MODERATOR" };
  } else if (selectedRole === "DOSEN") {
    roleFilter = { role: "USER", userType: "DOSEN" };
  } else if (selectedRole === "MAHASISWA") {
    roleFilter = { role: "USER", userType: "MAHASISWA" };
  }

  const where = {
    ...roleFilter,
    ...(safeQ
      ? {
          OR: [
            { username: { contains: safeQ, mode: "insensitive" as const } },
            { name: { contains: safeQ, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

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
        take: pageSize,
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = [
    { label: "Total akun", num: totalAll },
    { label: "Mahasiswa", num: mahasiswaCount },
    { label: "Dosen", num: dosenCount },
    { label: "Admin & moderator", num: stafCount },
  ];

  const serializedUsers: SerializedAdminUser[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    userType: u.userType,
    createdAt: u.createdAt.toISOString(),
  }));

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

      {/* DataTables Modern Responsive Identik dengan Halaman Logs */}
      <AdminUsersDataTable
        users={serializedUsers}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        pageSize={pageSize}
        currentRole={selectedRole}
        currentQuery={q ?? ""}
      />
    </AppShell>
  );
}

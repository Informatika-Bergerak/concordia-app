import { AppShell } from "@/components/app-shell";
import { requireRole } from "../../lib/auth/guards";
import { prisma } from "@/lib/db";

function typeLabel(role: string, userType: string | null) {
  if (role === "ADMIN") return { text: "Admin", cls: "badge badge-admin" };
  if (role === "MODERATOR") return { text: "Moderator", cls: "badge badge-moderator" };
  if (userType === "DOSEN") return { text: "Dosen", cls: "badge badge-dosen" };
  return { text: "Mahasiswa", cls: "badge" };
}

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      userType: true,
      createdAt: true,
    },
  });

  const total = users.length;
  const mahasiswa = users.filter((u) => u.role === "USER" && u.userType === "MAHASISWA").length;
  const dosen = users.filter((u) => u.role === "USER" && u.userType === "DOSEN").length;
  const staf = users.filter((u) => u.role !== "USER").length;

  const stats = [
    { label: "Total akun", num: total },
    { label: "Mahasiswa", num: mahasiswa },
    { label: "Dosen", num: dosen },
    { label: "Admin & moderator", num: staf },
  ];

  return (
    <AppShell user={session.user}>
      <h1 className="page-title">Panel Admin</h1>
      <p className="page-sub">Kelola akun pengguna ConCordia.</p>

      <div className="grid">
        {stats.map((s) => (
          <div className="card stat" key={s.label}>
            <div className="num">{s.num}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
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
            {users.map((u) => {
              const t = typeLabel(u.role, u.userType);
              return (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.name}</td>
                  <td><span className={t.cls}>{t.text}</span></td>
                  <td>{u.createdAt.toLocaleDateString("id-ID")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
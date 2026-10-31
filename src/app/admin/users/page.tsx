import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { toggleActiveAction } from "./actions";
import { CreateUserForm } from "./create-user-form";
import { ResetPasswordButton } from "./reset-password-button";

function typeLabel(role: string, userType: string | null) {
  if (role === "ADMIN") return { text: "Admin", cls: "badge badge-admin" };
  if (role === "MODERATOR") return { text: "Moderator", cls: "badge badge-moderator" };
  if (userType === "DOSEN") return { text: "Dosen", cls: "badge badge-dosen" };
  return { text: "Mahasiswa", cls: "badge" };
}

export default async function AdminUsersPage() {
  const { user: admin } = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      userType: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  return (
    <AppShell user={admin}>
      <h1 className="page-title">Kelola Akun</h1>
      <p className="page-sub">Buat akun, reset password, dan aktifkan atau nonaktifkan pengguna.</p>

      <CreateUserForm />

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
                          disabled={u.id === admin.id}
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
    </AppShell>
  );
}
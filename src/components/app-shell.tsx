import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "@/auth";

type Props = {
  user: Session["user"];
  children: React.ReactNode;
};

function roleBadge(user: Session["user"]) {
  if (user.role === "ADMIN") return { label: "Admin", cls: "badge badge-admin" };
  if (user.role === "MODERATOR") return { label: "Moderator", cls: "badge badge-moderator" };
  if (user.userType === "DOSEN") return { label: "Dosen", cls: "badge badge-dosen" };
  return { label: "Mahasiswa", cls: "badge" };
}

export function AppShell({ user, children }: Props) {
  const badge = roleBadge(user);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">ConCordia</Link>

        <nav className="nav">
          {user.role === "USER" && <Link href="/dashboard">Dashboard</Link>}
          {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {(user.role === "MODERATOR" || user.role === "ADMIN") && (
            <Link href="/moderator">Moderasi</Link>
          )}
          {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {user.role === "ADMIN" && <Link href="/admin/users">Kelola Akun</Link>}
        </nav>

        <div className="user-box">
          <span>{user.name}</span>
          <span className={badge.cls}>{badge.label}</span>
          <Link href="/change-password" className="btn btn-ghost">Ganti password</Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn btn-ghost">Keluar</button>
          </form>
        </div>
      </header>

      <main className="container">{children}</main>
    </>
  );
}
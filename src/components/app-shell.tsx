import Link from "next/link";
import { signOut } from "@/auth";
import { AppShellNavLink } from "./app-shell-nav-link";
import type { Role, UserType } from "@/generated/prisma/enums";

type AppUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  userType: UserType | null;
};

type Props = {
  user: AppUser;
  children: React.ReactNode;
};

function roleBadge(user: AppUser) {
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
          <AppShellNavLink href="/beranda">Beranda</AppShellNavLink>
          {user.role === "ADMIN" && <AppShellNavLink href="/admin">Dashboard</AppShellNavLink>}
          {(user.role === "MODERATOR" || user.role === "ADMIN") && (
            <AppShellNavLink href="/moderator">Moderasi</AppShellNavLink>
          )}
          {user.role === "ADMIN" && <AppShellNavLink href="/admin/users">Kelola Akun</AppShellNavLink>}
          {user.role === "ADMIN" && <AppShellNavLink href="/admin/reports">Laporan</AppShellNavLink>}
          {user.role === "ADMIN" && <AppShellNavLink href="/admin/audit-logs">Log Aktivitas</AppShellNavLink>}
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

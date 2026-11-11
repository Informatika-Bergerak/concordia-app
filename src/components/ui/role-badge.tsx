import type { Role, UserType } from "@/generated/prisma/enums";
import styles from "./role-badge.module.css";

type RoleBadgeProps = {
  role: Role;
  userType?: UserType | null;
  size?: "sm" | "md";
  hideStudent?: boolean;
};

export function RoleBadge({
  role,
  userType,
  size = "sm",
  hideStudent = true,
}: RoleBadgeProps) {
  if (role === "USER" && userType === "MAHASISWA" && hideStudent) return null;

  const label = role === "ADMIN"
    ? "Admin"
    : role === "MODERATOR"
      ? "Moderator"
      : userType === "DOSEN"
        ? "Dosen"
        : "Mahasiswa";
  const variant = role === "ADMIN" ? "admin" : role === "MODERATOR" ? "moderator" : userType === "DOSEN" ? "dosen" : "student";

  return <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>{label}</span>;
}

import type { Role } from "@/generated/prisma/enums";

type StaffLink = { href: string; label: string };
type StaffSection = { title: string; links: StaffLink[] };

const moderation: StaffSection = {
  title: "Moderasi",
  links: [{ href: "/moderator", label: "Panel Moderasi" }],
};

export function getStaffSections(role: Role): StaffSection[] {
  if (role === "MODERATOR") return [moderation];
  if (role === "ADMIN") {
    return [{
      title: "Administrasi",
      links: [
        { href: "/admin", label: "Dashboard" },
        ...moderation.links,
        { href: "/admin/users", label: "Kelola Akun" },
        { href: "/admin/audit-logs", label: "Log Aktivitas" },
      ],
    }];
  }
  return [];
}

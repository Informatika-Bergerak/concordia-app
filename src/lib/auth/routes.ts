import type { Role } from "@/generated/prisma/enums";

export const homeByRole: Record<Role, string> = {
  // USER: "/dashboard",
  USER: "/beranda",
  MODERATOR: "/moderator",
  ADMIN: "/admin",
};
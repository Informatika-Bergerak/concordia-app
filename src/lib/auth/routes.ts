import type { Role } from "@/generated/prisma/enums";

export const homeByRole: Record<Role, string> = {
  USER: "/dashboard",
  MODERATOR: "/moderator",
  ADMIN: "/admin",
};
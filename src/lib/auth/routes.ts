import type { Role } from "@/generated/prisma/enums";

export const homeByRole: Record<Role, string> = {
  USER: "/beranda",
  MODERATOR: "/beranda",
  ADMIN: "/beranda",
};
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");
  return session;
}
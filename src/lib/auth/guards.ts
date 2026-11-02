import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

// Ambil user terbaru dari database. Null jika belum login atau akun nonaktif.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Token lama (id teks) menghasilkan NaN, sehingga otomatis dianggap belum login
  const id = Number(session.user.id);
  if (!Number.isInteger(id)) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      userType: true,
      fotoProfil: true,
      jurusan: true,
      trustScore: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

export async function requireRole(allowed: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  if (!allowed.includes(user.role)) redirect("/unauthorized");
  return { user };
}
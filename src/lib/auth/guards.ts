import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import {
  SESSION_IDLE_MINUTES,
  SESSION_HEARTBEAT_SECONDS,
} from "@/lib/auth/session-config";

// Ambil user terbaru dari database.
// Null jika belum login, akun nonaktif, atau sesi tidak valid (perangkat lain sudah login).
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Pastikan sid ada di token — token lama (sebelum fitur single-device) tidak memilikinya
  const sid = session.user.sid;
  if (!sid) return null;

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
      // Kolom sesi — hanya untuk validasi, tidak dikembalikan ke pemanggil
      activeSessionId: true,
      lastSeenAt: true,
    },
  });

  if (!user || !user.isActive) return null;

  // Validasi bahwa sid di JWT cocok dengan yang ada di database
  if (user.activeSessionId !== sid) return null;

  // Validasi bahwa sesi tidak melebihi batas tidak aktif
  const idleCutoff = new Date(Date.now() - SESSION_IDLE_MINUTES * 60 * 1000);
  if (!user.lastSeenAt || user.lastSeenAt < idleCutoff) return null;

  // Perbarui lastSeenAt jika sudah melewati threshold heartbeat (dibatasi agar tidak terlalu sering)
  const heartbeatCutoff = new Date(
    Date.now() - SESSION_HEARTBEAT_SECONDS * 1000,
  );
  if (user.lastSeenAt < heartbeatCutoff) {
    // updateMany dengan where sid agar atomik — tidak akan memperbarui jika sesi sudah dicabut
    await prisma.user.updateMany({
      where: { id, activeSessionId: sid },
      data: { lastSeenAt: new Date() },
    });
  }

  // Kembalikan dengan shape kontrak yang sama (tanpa activeSessionId/lastSeenAt)
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    userType: user.userType,
    fotoProfil: user.fotoProfil,
    jurusan: user.jurusan,
    trustScore: user.trustScore,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
});

export async function requireRole(allowed: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  if (!allowed.includes(user.role)) redirect("/unauthorized");
  return { user };
}

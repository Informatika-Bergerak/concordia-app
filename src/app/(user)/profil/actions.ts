"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { setProfilePrivacy } from "@/modules/trust/profile-privacy";

export type PrivacyActionResult = { ok: true; isPrivate: boolean } | { ok: false; error: string };

export async function toggleProfilePrivacyAction(): Promise<PrivacyActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan login ulang" };

  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { isProfilePrivate: true } });
  if (!current) return { ok: false, error: "User tidak ditemukan" };

  const next = !current.isProfilePrivate;
  try {
    await setProfilePrivacy(prisma, user.id, next);
    revalidatePath("/profil");
    return { ok: true, isPrivate: next };
  } catch (error) {
    console.error("[profile] Gagal mengubah privasi profil:", (error as Error).message);
    return { ok: false, error: "Gagal mengubah privasi profil, coba lagi" };
  }
}

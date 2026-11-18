"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  nickname: z.string().trim().max(50, "Nickname maksimal 50 karakter."),
  email: z.string().trim().toLowerCase().email("Format email tidak valid").max(254, "Email terlalu panjang").or(z.literal("")),
  bio: z.string().trim().max(300, "Bio maksimal 300 karakter."),
  fotoProfil: z.string().url().optional(),
}).strict();

export type UpdateProfileState = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(input: unknown): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan login ulang" };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data profil tidak valid" };

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (parsed.data.fotoProfil && cloud && !parsed.data.fotoProfil.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
    return { ok: false, error: "Foto profil tidak valid" };
  }

  const email = parsed.data.email || null;
  if (email) {
    const duplicate = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (duplicate) return { ok: false, error: "Email sudah dipakai akun lain" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        nickname: parsed.data.nickname || null,
        email,
        bio: parsed.data.bio || null,
        ...(parsed.data.fotoProfil ? { fotoProfil: parsed.data.fotoProfil } : {}),
      },
    });
    revalidatePath("/profil");
    revalidatePath("/profil/ubah");
    return { ok: true };
  } catch (error) {
    console.error("[profile] Gagal memperbarui profil:", (error as Error).message);
    return { ok: false, error: "Gagal menyimpan profil, coba lagi" };
  }
}

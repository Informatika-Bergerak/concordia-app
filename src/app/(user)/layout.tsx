import type { ReactNode } from "react";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole(["USER"]);
  const people = await prisma.user.findMany({
    where: { role: "USER", isActive: true, id: { not: user.id } },
    select: { id: true, name: true, fotoProfil: true },
    take: 6,
    orderBy: { name: "asc" },
  });

  return (
    <MobileShell user={{ name: user.name, fotoProfil: user.fotoProfil }} people={people}>
      {children}
    </MobileShell>
  );
}
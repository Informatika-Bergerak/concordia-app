import type { ReactNode } from "react";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { requireRole } from "@/lib/auth/guards";
import { getSuggestedPeople } from "@/modules/friends/queries";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const people = await getSuggestedPeople(6);

  return (
    <MobileShell user={{ name: user.name, fotoProfil: user.fotoProfil, role: user.role, userType: user.userType }} people={people}>
      {children}
    </MobileShell>
  );
}
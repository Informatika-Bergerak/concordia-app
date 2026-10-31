import type { ReactNode } from "react";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { requireRole } from "@/lib/auth/guards";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole(["USER"]);
  return <MobileShell userName={user.name}>{children}</MobileShell>;
}
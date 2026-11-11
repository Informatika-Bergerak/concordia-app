"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppShellNavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function AppShellNavLink({ href, children }: AppShellNavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return <Link href={href} className={active ? "active" : undefined}>{children}</Link>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Home, Menu, MessageCircle, Search, ShoppingCart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import styles from "./top-bar.module.css";

const tabs = [
  { href: "/beranda", label: "Beranda", Icon: Home },
  { href: "/chat", label: "Chat", Icon: MessageCircle },
  { href: "/event", label: "Event", Icon: CalendarDays },
  { href: "/fjb", label: "FJB", Icon: ShoppingCart },
] as const;

export function TopBar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        <Link href="/menu" aria-label="Menu" className={styles.plain}>
          <Menu size={26} />
        </Link>
        <Link href="/beranda" className={styles.brand}>
          Concordia
        </Link>
        <div className={styles.actions}>
          <Link href="/search" aria-label="Cari" className={styles.round}>
            <Search size={16} />
          </Link>
          <Link href="/notifikasi" aria-label="Notifikasi" className={styles.round}>
            <Bell size={18} />
          </Link>
          <Link href="/profil" aria-label="Profil">
            <Avatar name={userName} size={30} />
          </Link>
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Navigasi utama">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={active ? styles.tabActive : styles.tab}
            >
              <Icon size={26} />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CalendarDays,
  Heart,
  MessageSquare,
  Plus,
  ShoppingCart,
  Users,
  UsersRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import styles from "./menu-content.module.css";

type MenuUser = {
  name: string;
  fotoProfil: string | null;
};

type MenuContentProps = {
  user: MenuUser;
  onNavigate?: () => void;
};

const tiles = [
  { href: "/teman", label: "Friends", Icon: Users },
  { href: "/grup", label: "Group", Icon: UsersRound },
  { href: "/disukai", label: "Like", Icon: Heart },
  { href: "/beranda", label: "Threads", Icon: MessageSquare },
  { href: "/event", label: "Event", Icon: CalendarDays },
  { href: "/fjb", label: "Marketplace", Icon: ShoppingCart },
] as const;

const helpLinks = [
  { href: "/bantuan/ketentuan", label: "Term And Policies" },
  { href: "/bantuan/dukungan", label: "Support" },
  { href: "/bantuan/bug", label: "Report Bug" },
] as const;

const settingLinks = [
  { href: "/pengaturan", label: "Setting" },
  { href: "/privasi", label: "Privacy Centre" },
  { href: "/tentang", label: "About" },
] as const;

function Accordion({
  title,
  links,
  pathname,
  onNavigate,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronUp
          size={18}
          className={`${styles.accordionChevron} ${open ? "" : styles.accordionChevronOpen}`}
        />
      </button>
      {open && (
        <div className={styles.accordionBody}>
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.accordionLink} ${active ? styles.accordionLinkActive : ""}`}
                onClick={onNavigate}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MenuContent({ user, onNavigate }: MenuContentProps) {
  const pathname = usePathname();

  function handleLogout() {
    signOut({ redirectTo: "/login" });
  }

  return (
    <div className={styles.menuContent}>
      {/* Profile card */}
      <div className={styles.profileCard}>
        <Avatar name={user.name} size={44} />
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>{user.name}</div>
        </div>
        <Link
          href="/profil"
          className={styles.profileChevron}
          aria-label="Lihat profil"
          onClick={onNavigate}
        >
          <ChevronDown size={18} />
        </Link>
      </div>

      {/* Create post */}
      <Link href="/beranda" className={styles.createPost} onClick={onNavigate}>
        <span className={styles.createPostIcon}>
          <Plus size={18} />
        </span>
        Buat Postingan
      </Link>

      {/* Tile grid */}
      <div className={styles.tileGrid}>
        {tiles.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.tile} ${active ? styles.tileActive : ""}`}
              onClick={onNavigate}
            >
              <span className={styles.tileIcon}>
                <Icon size={16} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Report tile */}
      <Link href="/laporan" className={styles.tileFull} onClick={onNavigate}>
        <span className={styles.tileIcon}>
          <AlertTriangle size={16} />
        </span>
        <div className={styles.tileFullText}>
          <div className={styles.tileFullTitle}>Report A Problem</div>
          <div className={styles.tileFullSub}>
            Laporkan Masalah Yang Sedang terjadi.
          </div>
        </div>
      </Link>

      {/* See more */}
      <button type="button" className={styles.seeMore}>
        See more
      </button>

      <hr className={styles.divider} />

      {/* Help and support */}
      <Accordion
        title="Help and support"
        links={helpLinks}
        pathname={pathname}
        onNavigate={onNavigate}
      />

      {/* Setting and privacy */}
      <Accordion
        title="Setting and privacy"
        links={settingLinks}
        pathname={pathname}
        onNavigate={onNavigate}
      />

      {/* Logout */}
      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}

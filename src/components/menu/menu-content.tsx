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
import { RoleBadge } from "@/components/ui/role-badge";
import { getStaffSections } from "./menu-config";
import type { Role, UserType } from "@/generated/prisma/enums";
import { signOut } from "next-auth/react";
import styles from "./menu-content.module.css";

type MenuUser = {
  name: string;
  fotoProfil: string | null;
  role: Role;
  userType: UserType | null;
};

type MenuContentProps = {
  user: MenuUser;
  onNavigate?: () => void;
};

const tiles = [
  { href: "/beranda", label: "Threads", Icon: MessageSquare },
  { href: "/teman", label: "Friends", Icon: Users },
  { href: "/grup", label: "Group", Icon: UsersRound },
  { href: "/disukai", label: "Like", Icon: Heart },
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
  defaultOpen = true,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  pathname: string;
  onNavigate?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

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
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.accordionLink} ${active ? `${styles.accordionLinkActive} active` : ""}`}
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
  const [showAllMenuItems, setShowAllMenuItems] = useState(false);
  const staffSections = getStaffSections(user.role);

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
          <RoleBadge role={user.role} userType={user.userType} hideStudent={false} />
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

      {/* Navigation */}
      <div className={styles.menuList}>
        {tiles.map(({ href, label, Icon }, index) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const optional = index >= 5;
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.menuItem} ${active ? styles.menuItemActive : ""} ${optional ? styles.menuItemOptional : ""} ${showAllMenuItems ? styles.menuItemVisible : ""}`}
              onClick={onNavigate}
            >
              <span className={styles.menuItemIcon}>
                <Icon size={20} />
              </span>
              {label}
            </Link>
          );
        })}
        <Link
          href="/laporan"
          className={`${styles.menuItem} ${styles.reportItem} ${showAllMenuItems ? styles.menuItemVisible : ""}`}
          onClick={onNavigate}
        >
          <span className={styles.menuItemIcon}>
            <AlertTriangle size={20} />
          </span>
          <span>
            <span className={styles.reportTitle}>Report A Problem</span>
            <span className={styles.reportDescription}>
              Laporkan Masalah Yang Sedang terjadi.
            </span>
          </span>
        </Link>
      </div>

      <button
        type="button"
        className={styles.seeMore}
        onClick={() => setShowAllMenuItems((show) => !show)}
        aria-expanded={showAllMenuItems}
      >
        {showAllMenuItems ? "Lihat lebih sedikit" : "Lihat selengkapnya"}
      </button>

      {staffSections.length > 0 && (
        <>
          <hr className={styles.divider} />
          {staffSections.map((section) => (
            <Accordion
              key={section.title}
              title={section.title}
              links={section.links}
              pathname={pathname}
              onNavigate={onNavigate}
              defaultOpen
            />
          ))}
        </>
      )}

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

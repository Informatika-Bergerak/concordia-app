"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { TopBar } from "./top-bar";
import { MenuContent } from "@/components/menu/menu-content";
import styles from "./mobile-shell.module.css";

type ShellUser = {
  name: string;
  fotoProfil: string | null;
};

type MobileShellProps = {
  user: ShellUser;
  children: ReactNode;
};

export function MobileShell({ user, children }: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Focus trap & Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    // Lock body scroll
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // Focus drawer
    drawerRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [drawerOpen, closeDrawer]);

  // Store trigger ref for focus return
  const handleMenuToggle = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLButtonElement;
    openDrawer();
  }, [openDrawer]);

  // Return focus to trigger on close
  useEffect(() => {
    if (!drawerOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [drawerOpen]);

  return (
    <div className={styles.stage}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar} aria-label="Menu">
        <MenuContent user={user} />
      </aside>

      {/* Mobile drawer overlay */}
      <div
        className={`${styles.overlay} ${drawerOpen ? styles.overlayOpen : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
      >
        <MenuContent user={user} onNavigate={closeDrawer} />
      </div>

      {/* Main content */}
      <div className={styles.main}>
        <TopBar userName={user.name} onMenuToggle={handleMenuToggle} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
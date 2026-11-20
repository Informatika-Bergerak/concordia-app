"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { toggleProfilePrivacyAction } from "@/app/(user)/profil/actions";
import styles from "./profile-menu.module.css";

export function ProfileMenu({ isProfilePrivate }: { isProfilePrivate: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(isProfilePrivate);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [open]);

  function handlePrivacyToggle() {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await toggleProfilePrivacyAction();
      if (result.ok) setIsPrivate(result.isPrivate);
      else setError(result.error);
    });
  }

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Opsi profil"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={26} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className={styles.menu}>
          <Link href="/profil/ubah" role="menuitem" className={styles.item} onClick={() => setOpen(false)}>
            Set Up Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            disabled={isPending}
            onClick={handlePrivacyToggle}
          >
            {isPending ? "Menyimpan…" : isPrivate ? "Set Profile Public" : "Set Profile Private"}
          </button>
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

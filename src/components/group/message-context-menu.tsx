"use client";

import { useEffect, useRef } from "react";
import { Edit2, Trash2 } from "lucide-react";
import styles from "./group.module.css";

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function MessageContextMenu({ onEdit, onDelete, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className={styles.contextMenu} ref={menuRef}>
      <button type="button" className={`${styles.menuItem} ${styles.editItem}`} onClick={() => { onEdit(); onClose(); }}>
        <Edit2 size={16} />
        Edit Pesan
      </button>
      <button type="button" className={`${styles.menuItem} ${styles.deleteItem}`} onClick={() => { onDelete(); onClose(); }}>
        <Trash2 size={16} />
        Hapus Pesan
      </button>
    </div>
  );
}

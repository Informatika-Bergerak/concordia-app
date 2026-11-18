"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePostAction } from "@/modules/forum/actions";
import styles from "./post-card.module.css";

export function DeletePostButton({ postId, redirectTo }: { postId: number; redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Hapus postingan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    startTransition(async () => {
      const result = await deletePostAction({ postId });
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button type="button" className={styles.deleteButton} onClick={remove} disabled={pending}>
      {pending ? "Menghapus..." : "Hapus postingan"}
    </button>
  );
}

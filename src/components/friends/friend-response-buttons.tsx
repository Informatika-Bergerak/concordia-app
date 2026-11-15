"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { acceptFriendRequestAction, rejectFriendRequestAction } from "@/modules/friends/actions";
import styles from "./friends.module.css";

export function FriendResponseButtons({ requestId }: { requestId: number }) {
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function respond(accept: boolean) {
    setError(null);
    startTransition(async () => {
      const result = accept
        ? await acceptFriendRequestAction({ requestId })
        : await rejectFriendRequestAction({ requestId });
      if (result.ok) setDone(accept ? "accepted" : "rejected");
      else setError(result.error);
    });
  }

  if (done) return <span className={styles.resultText}>{done === "accepted" ? "Sekarang berteman" : "Ditolak"}</span>;

  return (
    <div className={styles.responseControl}>
      <button type="button" className={styles.primaryButton} onClick={() => respond(true)} disabled={pending}>
        <Check size={16} aria-hidden="true" /> Terima
      </button>
      <button type="button" className={styles.secondaryButton} onClick={() => respond(false)} disabled={pending}>
        <X size={16} aria-hidden="true" /> Tolak
      </button>
      {error && <span className={styles.inlineError} role="alert">{error}</span>}
    </div>
  );
}

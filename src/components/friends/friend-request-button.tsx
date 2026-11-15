"use client";

import { useState, useTransition } from "react";
import { Check, UserPlus } from "lucide-react";
import { sendFriendRequestAction } from "@/modules/friends/actions";
import type { FriendRelation } from "@/modules/friends/types";
import styles from "./friends.module.css";

export function FriendRequestButton({ userId, initialRelation }: { userId: number; initialRelation: FriendRelation }) {
  const [relation, setRelation] = useState(initialRelation);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await sendFriendRequestAction({ userId });
      if (result.ok) setRelation("PENDING_SENT");
      else setError(result.error);
    });
  }

  const label = relation === "FRIENDS"
    ? "Friends"
    : relation === "PENDING_SENT"
      ? "Requested"
      : relation === "PENDING_RECEIVED"
        ? "Accept request di Teman"
        : "Add Friend";

  return (
    <div className={styles.requestControl}>
      <button
        type="button"
        className={relation === "NONE" ? styles.primaryButton : styles.secondaryButton}
        onClick={send}
        disabled={pending || relation !== "NONE"}
        aria-label={`${label} untuk pengguna ini`}
      >
        {relation === "FRIENDS" ? <Check size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
        {pending ? "Mengirim..." : label}
      </button>
      {error && <span className={styles.inlineError} role="alert">{error}</span>}
    </div>
  );
}

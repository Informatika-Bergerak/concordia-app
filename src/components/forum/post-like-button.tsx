"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePostLikeAction } from "@/modules/forum/actions";
import styles from "./post-card.module.css";

export function PostLikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (pending) return;

    const previous = { liked, count };
    setError(null);
    setLiked(!liked);
    setCount(Math.max(0, count + (liked ? -1 : 1)));

    startTransition(async () => {
      try {
        const result = await togglePostLikeAction({ postId });
        if (!result.ok) {
          setLiked(previous.liked);
          setCount(previous.count);
          setError(result.error);
          return;
        }

        setLiked(result.liked);
        setCount(result.count);
      } catch {
        setLiked(previous.liked);
        setCount(previous.count);
        setError("Gagal memperbarui like, coba lagi");
      }
    });
  }

  return (
    <div className={styles.likeWrap}>
      <button
        type="button"
        className={`${styles.likeButton} ${liked ? styles.likeButtonOn : ""}`}
        aria-label={liked ? "Hapus like dari postingan" : "Sukai postingan"}
        aria-pressed={liked}
        disabled={pending}
        onClick={onClick}
      >
        <Heart size={20} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{count}</span>
      </button>
      {error && <p className={styles.likeError} role="alert">{error}</p>}
    </div>
  );
}

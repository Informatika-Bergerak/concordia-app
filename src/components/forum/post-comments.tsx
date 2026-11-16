"use client";

import { useState, useTransition } from "react";
import { Send, Smile } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import type { FeedComment } from "@/modules/forum/types";
import { createCommentAction } from "@/modules/forum/actions";
import styles from "./post-card.module.css";

export function PostComments({
  postId,
  initialComments,
  initialCount,
}: {
  postId: number;
  initialComments: FeedComment[];
  initialCount: number;
}) {
  const [comments, setComments] = useState(initialComments);
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const value = text.trim();
    if (!value) {
      setError("Komentar tidak boleh kosong.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await createCommentAction({ postId, text: value });
        if (!result.ok) {
          setError(result.error);
          return;
        }

        setComments((current) => [...current, result.comment]);
        setCount(result.count);
        setText("");
      } catch {
        setError("Gagal menyimpan komentar, coba lagi");
      }
    });
  }

  return (
    <>
      {comments.map((comment) => (
        <div className={styles.comment} key={comment.id}>
          <Avatar name={comment.authorName} size={26} />
          <div>
            <div className={styles.authorName}>
              <strong>{comment.authorName}</strong>
              <RoleBadge role={comment.authorRole ?? "USER"} userType={comment.authorType} />
              <span className={styles.time}>{comment.timeAgo}</span>
            </div>
            <p>{comment.text}</p>
          </div>
        </div>
      ))}

      <form className={styles.reply} onSubmit={onSubmit}>
        <Smile size={20} aria-hidden="true" />
        <label className={styles.visuallyHidden} htmlFor={`comment-${postId}`}>
          Tulis komentar
        </label>
        <input
          id={`comment-${postId}`}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          placeholder="Tulis Komentar...."
          maxLength={500}
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `comment-error-${postId}` : undefined}
        />
        <button type="submit" className={styles.replySubmit} disabled={pending} aria-label="Kirim komentar">
          <Send size={20} aria-hidden="true" />
        </button>
      </form>
      {error && <p id={`comment-error-${postId}`} className={styles.commentError} role="alert">{error}</p>}
      <span className={styles.visuallyHidden} aria-live="polite">{count} komentar</span>
    </>
  );
}

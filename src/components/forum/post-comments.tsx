"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Smile, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { TrustLevelBadge } from "@/components/ui/trust-level-badge";
import type { FeedComment, FeedMention } from "@/modules/forum/types";
import { createCommentAction, deleteCommentAction } from "@/modules/forum/actions";
import type { Role } from "@/generated/prisma/enums";
import styles from "./post-card.module.css";

type MentionCandidate = { id: number; name: string; username: string; photo: string | null };

function renderText(text: string, mentions: FeedMention[]) {
  if (!mentions.length) return text;
  const names = new Set(mentions.map((mention) => mention.name));
  return text.split(/(\s+)/).map((part, index) => (
    names.has(part.replace(/^@/, "")) ? <span className={styles.mention} key={`${part}-${index}`}>{part}</span> : part
  ));
}

export function PostComments({ postId, initialComments, initialCount, viewerId, viewerRole }: { postId: number; initialComments: FeedComment[]; initialCount: number; viewerId?: number; viewerRole?: Role }) {
  const [comments, setComments] = useState(initialComments);
  const [collapsed, setCollapsed] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState("");
  const [activeParent, setActiveParent] = useState<FeedComment | null>(null);
  const [mentionIds, setMentionIds] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<MentionCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const match = text.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/users/mentions?q=${encodeURIComponent(match[1])}`);
      if (response.ok) setSuggestions((await response.json()).users as MentionCandidate[]);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [text]);

  function selectMention(candidate: MentionCandidate) {
    const match = text.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) return;
    const prefix = text.slice(0, text.length - match[0].length);
    setText(`${prefix} @${candidate.name} `);
    setMentionIds((current) => current.includes(candidate.id) ? current : [...current, candidate.id]);
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function replyTo(comment: FeedComment) {
    setActiveParent(comment);
    inputRef.current?.focus();
  }

  function removeComment(items: FeedComment[], commentId: string): { items: FeedComment[]; removed: number; found: boolean } {
    let removed = 0;
    let found = false;
    const next: FeedComment[] = [];
    for (const item of items) {
      if (item.id === commentId) {
        found = true;
        removed += 1 + countReplies(item.replies);
        continue;
      }
      const nested = removeComment(item.replies, commentId);
      found ||= nested.found;
      removed += nested.removed;
      next.push(nested.found ? { ...item, replies: nested.items } : item);
    }
    return { items: next, removed, found };
  }

  function countReplies(items: FeedComment[]): number {
    return items.reduce((total, item) => total + 1 + countReplies(item.replies), 0);
  }

  function onDelete(comment: FeedComment) {
    if (!window.confirm("Hapus komentar ini beserta balasannya?")) return;
    startTransition(async () => {
      const result = await deleteCommentAction({ commentId: Number(comment.id) });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setComments((current) => {
        const removed = removeComment(current, comment.id);
        setCount((value) => Math.max(0, value - removed.removed));
        return removed.items;
      });
      if (activeParent?.id === comment.id) setActiveParent(null);
    });
  }

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
        const result = await createCommentAction({ postId, text: value, parentId: activeParent ? Number(activeParent.id) : null, mentionUserIds: mentionIds });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setComments((current) => {
          if (!result.comment.parentId) return [...current, result.comment];
          const addReply = (items: FeedComment[]): FeedComment[] => items.map((item) => item.id === result.comment.parentId ? { ...item, replies: [...item.replies, result.comment] } : { ...item, replies: addReply(item.replies) });
          return addReply(current);
        });
        setCount(result.count);
        setText("");
        setMentionIds([]);
        setActiveParent(null);
      } catch {
        setError("Gagal menyimpan komentar, coba lagi");
      }
    });
  }

  function renderComment(comment: FeedComment, depth = 0): React.ReactNode {
    return (
      <div className={styles.commentThread} key={comment.id}>
        <div className={styles.comment} style={{ marginLeft: Math.min(depth, 3) * 22 }}>
          <Avatar name={comment.authorName} size={26} />
          <div>
            <div className={styles.authorName}>
              <strong>{comment.authorName}</strong>
              <TrustLevelBadge role={comment.authorRole ?? "USER"} trustScore={comment.authorTrustScore ?? 0} />
              <RoleBadge role={comment.authorRole ?? "USER"} userType={comment.authorType} />
              <span className={styles.time}>{comment.timeAgo}</span>
            </div>
            <p>{renderText(comment.text, comment.mentions)}</p>
            <div className={styles.commentActions}>
              <button type="button" className={styles.replyLink} onClick={() => replyTo(comment)}>Balas</button>
              {(viewerRole === "ADMIN" || viewerRole === "MODERATOR" || comment.authorId === viewerId) && <button type="button" className={styles.deleteCommentButton} onClick={() => onDelete(comment)}>Hapus</button>}
            </div>
          </div>
        </div>
        {comment.replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  }

  return (
    <>
      <button type="button" className={styles.commentsToggle} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>
        {collapsed ? "Buka balasan" : "Tutup balasan"}
      </button>
      {!collapsed && <>
        {comments.map((comment) => renderComment(comment))}
        {activeParent && <div className={styles.replyingTo}>Membalas {activeParent.authorName}<button type="button" onClick={() => setActiveParent(null)} aria-label="Batal membalas"><X size={14} /></button></div>}
        <form className={styles.reply} onSubmit={onSubmit}>
        <Smile size={20} aria-hidden="true" />
        <label className={styles.visuallyHidden} htmlFor={`comment-${postId}`}>Tulis komentar</label>
        <input ref={inputRef} id={`comment-${postId}`} value={text} onChange={(event) => { setText(event.target.value); setError(null); }} placeholder={activeParent ? "Tulis balasan...." : "Tulis Komentar...."} maxLength={500} disabled={pending} aria-invalid={Boolean(error)} />
        <button type="submit" className={styles.replySubmit} disabled={pending} aria-label="Kirim komentar"><Send size={20} aria-hidden="true" /></button>
        {suggestions.length > 0 && <div className={styles.mentionSuggestions}>{suggestions.map((candidate) => <button type="button" key={candidate.id} onClick={() => selectMention(candidate)}><Avatar name={candidate.name} size={24} /><span>{candidate.name}<small>@{candidate.username}</small></span></button>)}</div>}
        </form>
        {error && <p id={`comment-error-${postId}`} className={styles.commentError} role="alert">{error}</p>}
      </>}
      <span className={styles.visuallyHidden} aria-live="polite">{count} komentar</span>
    </>
  );
}

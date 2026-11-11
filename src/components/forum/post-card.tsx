import { Heart, MessageSquare, MoreVertical, Send, Share2, Smile } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import type { Role } from "@/generated/prisma/enums";
import type { FeedPost } from "@/modules/forum/types";
import styles from "./post-card.module.css";

export function PostCard({ post, viewerRole }: { post: FeedPost; viewerRole?: Role }) {
  const canModerate = viewerRole === "MODERATOR" || viewerRole === "ADMIN";

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Avatar name={post.authorName} size={42} />
        <div className={styles.who}>
          <div className={styles.authorName}>
            <strong>{post.authorName}</strong>
            <RoleBadge role={post.authorRole ?? "USER"} userType={post.authorType} />
          </div>
          <span>{post.authorMajor}</span>
          <span className={styles.time}>{post.timeAgo}</span>
        </div>
        {canModerate ? (
          <details className={styles.moreMenu}>
            <summary className={styles.more} aria-label="Opsi postingan"><MoreVertical size={18} /></summary>
            <button type="button" disabled aria-disabled="true" title="Belum tersedia">Moderasi</button>
          </details>
        ) : (
          <button type="button" className={styles.more} aria-label="Opsi postingan"><MoreVertical size={18} /></button>
        )}
      </header>

      <p className={styles.text}>
        {post.text}
        {post.tag && <><br /><span className={styles.tag}>#{post.tag}</span></>}
      </p>

      {post.hasImage && <div className={styles.image} role="img" aria-label="Foto postingan (contoh)">Foto</div>}

      <div className={styles.actions}>
        <span className={styles.stat}><Heart size={20} /> {post.likes}</span>
        <span className={styles.stat}><MessageSquare size={20} /> {post.commentCount}</span>
        <span className={styles.share}><Share2 size={20} /> Bagikan</span>
      </div>

      <hr className={styles.divider} />

      {post.comments.map((c) => (
        <div className={styles.comment} key={c.id}>
          <Avatar name={c.authorName} size={26} />
          <div>
            <div className={styles.authorName}>
              <strong>{c.authorName}</strong>
              <RoleBadge role={c.authorRole ?? "USER"} userType={c.authorType} />
              <span className={styles.time}>{c.timeAgo}</span>
            </div>
            <p>{c.text}</p>
          </div>
        </div>
      ))}

      <div className={styles.reply}>
        <Smile size={20} />
        <input placeholder="Tulis Komentar...." readOnly aria-label="Tulis komentar" />
        <Send size={20} />
      </div>
    </article>
  );
}

import Link from "next/link";
import { ArrowLeft, MessageSquare, MoreVertical } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import type { Role } from "@/generated/prisma/enums";
import type { FeedPost } from "@/modules/forum/types";
import { PostComments } from "./post-comments";
import { PostLikeButton } from "./post-like-button";
import { PostShareButton } from "./post-share-button";
import styles from "./post-card.module.css";

export function ForumPostDetail({ post, viewerRole }: { post: FeedPost; viewerRole?: Role }) {
  const canModerate = viewerRole === "MODERATOR" || viewerRole === "ADMIN";

  return (
    <article className={`${styles.card} ${styles.detailCard}`}>
      <Link href="/beranda" className={styles.backLink}>
        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke beranda
      </Link>
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
        {canModerate && (
          <details className={styles.moreMenu}>
            <summary className={styles.more} aria-label="Opsi postingan"><MoreVertical size={18} /></summary>
            <button type="button" disabled aria-disabled="true" title="Belum tersedia">Moderasi</button>
          </details>
        )}
      </header>

      <p className={styles.text}>{post.text}</p>
      {post.imageUrl && (
        <div className={styles.image}>
          {/* URL berasal dari metadata media yang sudah divalidasi server. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={`Foto postingan dari ${post.authorName}`} />
        </div>
      )}
      {post.audioUrl && (
        <audio className={styles.audio} controls preload="metadata">
          <source src={post.audioUrl} />
          Browser Anda tidak mendukung pemutar audio.
        </audio>
      )}

      <div className={styles.actions}>
        <PostLikeButton
          postId={Number(post.id)}
          initialLiked={post.likedByViewer ?? false}
          initialCount={post.likes}
        />
        <span className={styles.stat}><MessageSquare size={20} /> {post.commentCount}</span>
        <PostShareButton postId={Number(post.id)} text={post.text} />
      </div>
      <hr className={styles.divider} />
      <PostComments
        postId={Number(post.id)}
        initialComments={post.comments}
        initialCount={post.commentCount}
      />
    </article>
  );
}

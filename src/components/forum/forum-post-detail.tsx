import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, MessageSquare, MoreVertical } from "lucide-react";
import { splitHashtagText } from "@/lib/forum/hashtags";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import type { Role } from "@/generated/prisma/enums";
import type { FeedPost } from "@/modules/forum/types";
import { PostComments } from "./post-comments";
import { PostLikeButton } from "./post-like-button";
import { PostShareButton } from "./post-share-button";
import { DeletePostButton } from "./delete-post-button";
import styles from "./post-card.module.css";

function renderPostText(text: string) {
  return splitHashtagText(text).map((part, index) => part.hashtag ? (
    <Link key={`${part.hashtag}-${index}`} href={`/search?q=${encodeURIComponent(part.hashtag)}`} className={styles.hashtag}>
      {part.text}
    </Link>
  ) : <span key={`text-${index}`}>{part.text}</span>);
}

export function ForumPostDetail({ post, viewerRole, viewerId }: { post: FeedPost; viewerRole?: Role; viewerId?: number }) {
  const canDelete = viewerId === post.authorId || viewerRole === "MODERATOR" || viewerRole === "ADMIN";

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
        {canDelete && (
          <details className={styles.moreMenu}>
            <summary className={styles.more} aria-label="Opsi postingan"><MoreVertical size={18} /></summary>
            <DeletePostButton postId={Number(post.id)} redirectTo="/beranda" />
          </details>
        )}
      </header>

      <p className={styles.text}>{renderPostText(post.text)}</p>
      {post.mentions.length > 0 && (
        <div className={styles.taggedPeople}>
          <span className={styles.mentionList}>
            {post.mentions.map((mention) => <span className={styles.mention} key={mention.userId}>@{mention.name}</span>)}
          </span>
        </div>
      )}
      {post.location && <a className={styles.attachment} href={post.location.url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location.label)}`} target="_blank" rel="noreferrer"><MapPin size={16} /> {post.location.label}</a>}
      {post.event && <div className={styles.attachment}><Calendar size={16} /> <strong>{post.event.title}</strong> · {post.event.date} {post.event.time} · {post.event.location}</div>}
      {post.poll && <div className={styles.poll}><strong>{post.poll.question}</strong>{post.poll.options.map((option) => <div key={option.id} className={styles.pollOption}>{option.text}<span>{option.votes}</span></div>)}</div>}
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
        viewerId={viewerId}
        viewerRole={viewerRole}
      />
    </article>
  );
}

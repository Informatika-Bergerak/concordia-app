import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, MessageSquare, MoreVertical, UserRound, Users } from "lucide-react";
import type { Role, UserType } from "@/generated/prisma/enums";
import { getTrustProgress } from "@/modules/trust/progression";
import type { FeedPost } from "@/modules/forum/types";
import { PostCard } from "@/components/forum/post-card";
import { getDisplayName } from "@/lib/users/display-name";
import styles from "./profile-page.module.css";

type ProfileUser = {
  id: number;
  username: string;
  name: string;
  nickname: string | null;
  role: Role;
  userType: UserType | null;
  fotoProfil: string | null;
  jurusan: string | null;
  trustScore: number;
  isActive: boolean;
  createdAt: Date;
};

type Reply = {
  id: number;
  postId: number;
  text: string;
  createdAt: Date;
  post: { id: number; text: string; author: { name: string; nickname: string | null } };
};

type ProfileGroup = {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  memberCount: number;
};

export type ProfilePageProps = {
  user: ProfileUser;
  viewerId: number;
  viewerRole: Role;
  tab: "threads" | "liked" | "replies" | "groups";
  threads: FeedPost[];
  liked: FeedPost[];
  replies: Reply[];
  groups: ProfileGroup[];
  isOwnProfile: boolean;
};

function getRoleLabel(role: Role, userType: UserType | null) {
  if (role === "ADMIN") return "Admin";
  if (role === "MODERATOR") return "Moderator";
  return userType === "DOSEN" ? "Dosen" : "Mahasiswa";
}

function ProfileAvatar({ user }: { user: ProfileUser }) {
  if (user.fotoProfil) {
    return (
      // The URL is validated and stored by the existing upload flow.
      // eslint-disable-next-line @next/next/no-img-element
      <img className={styles.avatarImage} src={user.fotoProfil} alt={`Foto profil ${user.name}`} />
    );
  }
  return <UserRound size={66} strokeWidth={1.8} aria-hidden="true" />;
}

function formatJoinedDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function timeAgo(date: Date) {
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit yang lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam yang lalu`;
  return `${Math.floor(h / 24)} hari yang lalu`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <section className={styles.emptyState} aria-labelledby="empty-title">
      <h2 id="empty-title">{title}</h2>
      <p>{desc}</p>
    </section>
  );
}

export function ProfilePage({
  user,
  viewerId,
  viewerRole,
  tab,
  threads,
  liked,
  replies,
  groups,
  isOwnProfile,
}: ProfilePageProps) {
  const displayName = user.nickname?.trim() || user.name;
  const trust = getTrustProgress(user.trustScore);
  const roleLabel = getRoleLabel(user.role, user.userType);
  const profileLine = user.jurusan ? `${roleLabel} - ${user.jurusan}` : roleLabel;
  const base = `/profil`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/beranda" className={styles.backButton} aria-label="Kembali ke beranda">
          <ArrowLeft size={32} strokeWidth={2.5} aria-hidden="true" />
        </Link>
        <span className={styles.headerTitle}>Profile</span>
        <button type="button" className={styles.menuButton} aria-label="Opsi profil" title="Opsi profil">
          <MoreVertical size={26} aria-hidden="true" />
        </button>
      </header>

      <main className={styles.profileCard}>
        <div className={styles.cover} aria-hidden="true" />
        <div className={styles.profileBody}>
          <div className={styles.profileTopRow}>
            <div className={styles.avatar}>
              <ProfileAvatar user={{ ...user, name: displayName }} />
            </div>
            {isOwnProfile && (
              <Link href="/profil/ubah" className={styles.setupButton}>Set Up Profile</Link>
            )}
          </div>

          <section className={styles.identity} aria-labelledby="profile-name">
            <h1 id="profile-name">{displayName}</h1>
            <p>{profileLine}</p>
            <p className={styles.joined}><CalendarDays size={18} aria-hidden="true" /> Joined {formatJoinedDate(user.createdAt)}</p>
          </section>

          {user.role !== "ADMIN" && (
            <section className={styles.trustSection} aria-labelledby="trust-heading">
              <div className={styles.trustHeading}>
                <h2 id="trust-heading">Trust Level</h2>
                <span className={styles.trustBadge}>Lv. {trust.level}</span>
              </div>
              <div className={styles.scoreBar} role="progressbar" aria-label="Progress Trust Level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={trust.percentage}>
                <span className={styles.scoreFill} style={{ width: `${trust.percentage}%` }} />
              </div>
              <p className={styles.scoreLabel}>{trust.levelXp} XP · {trust.currentLevelXp} / {trust.nextLevelXp} XP · {trust.remainingXp} XP menuju level berikutnya</p>
            </section>
          )}
        </div>

        <nav className={styles.tabs} aria-label="Konten profil">
          <Link href={`${base}?tab=threads`} className={tab === "threads" ? styles.tabActive : styles.tab} aria-current={tab === "threads" ? "page" : undefined}>Threads</Link>
          <Link href={`${base}?tab=liked`} className={tab === "liked" ? styles.tabActive : styles.tab} aria-current={tab === "liked" ? "page" : undefined}>Liked</Link>
          <Link href={`${base}?tab=replies`} className={tab === "replies" ? styles.tabActive : styles.tab} aria-current={tab === "replies" ? "page" : undefined}>Replies</Link>
          <Link href={`${base}?tab=groups`} className={tab === "groups" ? styles.tabActive : styles.tab} aria-current={tab === "groups" ? "page" : undefined}>Group</Link>
        </nav>

        {tab === "threads" && (
          threads.length > 0 ? (
            <div className={styles.postList}>
              {threads.map((post) => (
                <PostCard key={post.id} post={post} viewerRole={viewerRole} viewerId={viewerId} />
              ))}
            </div>
          ) : (
            <EmptyState title="You haven't posted yet" desc="Postingan yang kamu buat akan muncul di sini." />
          )
        )}

        {tab === "liked" && (
          liked.length > 0 ? (
            <div className={styles.postList}>
              {liked.map((post) => (
                <PostCard key={post.id} post={post} viewerRole={viewerRole} viewerId={viewerId} />
              ))}
            </div>
          ) : (
            <EmptyState title="Belum ada postingan yang disukai" desc="Postingan yang disukai akan muncul di sini." />
          )
        )}

        {tab === "replies" && (
          replies.length > 0 ? (
            <ul className={styles.replyList}>
              {replies.map((reply) => (
                <li key={reply.id} className={styles.replyItem}>
                  <Link href={`/beranda/post/${reply.postId}`} className={styles.replyLink}>
                    <div className={styles.replyContext}>
                      <MessageSquare size={14} aria-hidden="true" />
                      <span>Membalas postingan {getDisplayName(reply.post.author.nickname, reply.post.author.name)}</span>
                    </div>
                    <p className={styles.replyText}>{reply.text}</p>
                    <time className={styles.replyTime} dateTime={reply.createdAt.toISOString()}>{timeAgo(reply.createdAt)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Belum ada balasan" desc="Balasan yang kamu tulis akan muncul di sini." />
          )
        )}

        {tab === "groups" && (
          groups.length > 0 ? (
            <ul className={styles.groupList}>
              {groups.map((group) => (
                <li key={group.id}>
                  <Link href={`/grup/${group.id}`} className={styles.groupItem}>
                    <div className={styles.groupAvatar}>
                      {group.photo ? (
                        <Image src={group.photo} alt={group.name} width={46} height={46} unoptimized />
                      ) : (
                        <span>{getInitials(group.name) || <Users size={20} />}</span>
                      )}
                    </div>
                    <div className={styles.groupBody}>
                      <strong className={styles.groupName}>{group.name}</strong>
                      <span className={styles.groupMeta}>{group.memberCount} anggota</span>
                      {group.description && <p className={styles.groupDesc}>{group.description}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Belum ada grup" desc="Grup publik yang diikuti akan muncul di sini." />
          )
        )}


      </main>
    </div>
  );
}

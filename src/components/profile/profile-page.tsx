import Link from "next/link";
import { ArrowLeft, CalendarDays, MoreVertical, UserRound, X } from "lucide-react";
import type { Role, UserType } from "@/generated/prisma/enums";
import styles from "./profile-page.module.css";

type ProfileUser = {
  username: string;
  name: string;
  role: Role;
  userType: UserType | null;
  fotoProfil: string | null;
  jurusan: string | null;
  trustScore: number;
  isActive: boolean;
  createdAt: Date;
};

type ProfilePageProps = {
  user: ProfileUser;
  recommendations: { id: number; name: string; jurusan: string | null; fotoProfil: string | null }[];
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
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ProfilePage({ user, recommendations }: ProfilePageProps) {
  const score = Math.max(0, Math.min(100, user.trustScore));
  const roleLabel = getRoleLabel(user.role, user.userType);
  const profileLine = user.jurusan ? `${roleLabel} - ${user.jurusan}` : roleLabel;

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
              <ProfileAvatar user={user} />
            </div>
            <Link href="/profil/ubah" className={styles.setupButton}>Set Up Profile</Link>
          </div>

          <section className={styles.identity} aria-labelledby="profile-name">
            <h1 id="profile-name">{user.name}</h1>
            <p>{profileLine}</p>
            <p className={styles.joined}><CalendarDays size={18} aria-hidden="true" /> Joined {formatJoinedDate(user.createdAt)}</p>
          </section>

          <section className={styles.trustSection} aria-labelledby="trust-heading">
            <div className={styles.trustHeading}>
              <h2 id="trust-heading">Tingkat Kepercayaan</h2>
              <span className={styles.trustBadge}>{score >= 70 ? "Terpercaya" : "Berkembang"}</span>
            </div>
            <div className={styles.scoreBar} role="progressbar" aria-label="Skor kepercayaan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
              <span className={styles.scoreFill} style={{ width: `${score}%` }} />
            </div>
            <p className={styles.scoreLabel}>Skor Kepercayaan {score}/100</p>
          </section>
        </div>

        <nav className={styles.tabs} aria-label="Konten profil">
          <Link href="#threads" className={styles.tabActive} aria-current="page">Threads</Link>
          <Link href="#liked" className={styles.tab}>Liked</Link>
          <Link href="#replies" className={styles.tab}>Replies</Link>
          <Link href="#events" className={styles.tab}>Event</Link>
        </nav>

        <section id="threads" className={styles.emptyState} aria-labelledby="empty-title">
          <h2 id="empty-title">You haven’t posted<br />yet</h2>
          <p>When you repost, those posts will show up here.</p>
        </section>

        <section className={styles.recommendations} aria-labelledby="recommendation-title">
          <h2 id="recommendation-title">Rekomendasi Grup</h2>
          <div className={styles.recommendationList}>
            {recommendations.map((person) => (
              <div className={styles.recommendation} key={person.id}>
                <span className={styles.recommendationAvatar} aria-hidden="true">
                  {person.fotoProfil ? (
                    // The URL is validated and stored by the existing upload flow.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.fotoProfil} alt="" />
                  ) : <UserRound size={25} />}
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.jurusan ? `Mahasiswa ${person.jurusan}` : "Mahasiswa"}</span>
                </div>
                <button type="button" className={styles.dismissButton} aria-label={`Sembunyikan rekomendasi ${person.name}`}>
                  <X size={28} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

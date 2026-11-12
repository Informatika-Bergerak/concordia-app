import Link from "next/link";
import { ArrowLeft, Check, Minus, UserRound } from "lucide-react";
import type { Role, UserType } from "@/generated/prisma/enums";
import { Logo } from "@/components/brand/logo";
import styles from "./profile-page.module.css";

type ProfileUser = {
  username: string;
  name: string;
  role: Role;
  userType: UserType | null;
  fotoProfil: string | null;
  trustScore: number;
  isActive: boolean;
};

type ProfilePageProps = {
  user: ProfileUser;
};

type TrustIndicator = {
  label: string;
  points: number;
  complete: boolean;
};

function getRoleLabel(role: Role, userType: UserType | null) {
  if (role === "ADMIN") return "Admin";
  if (role === "MODERATOR") return "Moderator";
  return userType === "DOSEN" ? "Dosen" : "Mahasiswa";
}

function getTrustIndicators(user: ProfileUser): TrustIndicator[] {
  return [
    { label: "NPM Terverifikasi", points: 40, complete: Boolean(user.username) },
    { label: "Foto Profil Terpasang", points: 20, complete: Boolean(user.fotoProfil) },
    { label: "Nama Lengkap", points: 20, complete: Boolean(user.name.trim()) },
    {
      label: `Skor Reputasi ${Math.max(0, Math.min(100, user.trustScore))}/100`,
      points: 17,
      complete: user.trustScore > 0,
    },
  ];
}

function ProfileAvatar({ user }: { user: ProfileUser }) {
  if (user.fotoProfil) {
    return (
      // The URL is validated and stored by the existing upload flow.
      // eslint-disable-next-line @next/next/no-img-element
      <img className={styles.avatarImage} src={user.fotoProfil} alt="" />
    );
  }

  return <UserRound size={58} strokeWidth={1.8} aria-hidden="true" />;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const score = Math.max(0, Math.min(100, user.trustScore));
  const indicators = getTrustIndicators(user);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/beranda" className={styles.backButton} aria-label="Kembali ke beranda">
          <ArrowLeft size={34} strokeWidth={2.2} aria-hidden="true" />
        </Link>
        <Logo variant="full" size={78} className={styles.logo} />
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.identityCard} aria-labelledby="profile-name">
        <div className={styles.identityRow}>
          <div className={styles.avatar} aria-hidden="true">
            <ProfileAvatar user={user} />
          </div>
          <div className={styles.identityDetails}>
            <h1 id="profile-name">{user.name}</h1>
            <p>{user.username}</p>
            <span className={styles.identityAccent} aria-hidden="true" />
          </div>
        </div>

        <div
          className={styles.scoreBar}
          role="progressbar"
          aria-label="Skor kepercayaan"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
        >
          <span className={styles.scoreFill} style={{ width: `${score}%` }} />
        </div>
        <p className={styles.scoreLabel}>Skor Kepercayaan {score}/100</p>
      </section>

      <section className={styles.trustCard} aria-labelledby="trust-heading">
        <h2 id="trust-heading">Tingkat Kepercayaan</h2>
        <ul className={styles.indicatorList}>
          {indicators.map((indicator) => (
            <li key={indicator.label} className={styles.indicator}>
              <span
                className={`${styles.indicatorIcon} ${indicator.complete ? styles.complete : styles.incomplete}`}
                aria-hidden="true"
              >
                {indicator.complete ? <Check size={19} strokeWidth={2.5} /> : <Minus size={19} strokeWidth={2.5} />}
              </span>
              <span className={styles.indicatorLabel}>{indicator.label}</span>
              <span className={styles.indicatorPoints}>+{indicator.points}</span>
            </li>
          ))}
        </ul>
        <p className={styles.trustNote}>
          Skor reputasi turun jika konten Anda terbukti melanggar saat dimoderasi.
        </p>
      </section>

      <section className={styles.detailsCard} aria-label="Informasi akun">
        <div className={styles.detailRow}>
          <span>Peran</span>
          <strong>{getRoleLabel(user.role, user.userType)}</strong>
        </div>
        <div className={styles.detailRow}>
          <span>Status Akun</span>
          <strong>{user.isActive ? "Aktif" : "Tidak Aktif"}</strong>
        </div>
        <div className={styles.detailRow}>
          <span>Password</span>
          <strong aria-label="Password disembunyikan">••••••••••</strong>
        </div>
      </section>

      <Link href="/profil/ubah" className={styles.editButton}>
        Ubah Profil
      </Link>
    </div>
  );
}

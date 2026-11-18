import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { PostCard } from "@/components/forum/post-card";
import { FriendRequestButton } from "@/components/friends/friend-request-button";
import { searchPeople } from "@/modules/friends/queries";
import { searchPosts } from "@/modules/forum/queries";
import { getAdminNews } from "@/modules/news/queries";
import { requireRole } from "@/lib/auth/guards";
import { SearchForm } from "@/components/search/search-form";
import { SearchHistory } from "@/components/search/search-history";
import styles from "./search.module.css";
import friendStyles from "@/components/friends/friends.module.css";

const tabs = [
  { label: "Explore", href: "/search" },
  { label: "Postingan", href: "#posts-heading" },
  { label: "Group", href: "#groups" },
  { label: "Event", href: "#events" },
  { label: "Person", href: "#people-heading" },
] as const;

function PersonResult({ person }: { person: Awaited<ReturnType<typeof searchPeople>>[number] }) {
  return (
    <article className={`${friendStyles.person} ${styles.personRow}`}>
      {person.fotoProfil ? (
        // URL berasal dari metadata foto yang sudah divalidasi server.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={friendStyles.avatar} src={person.fotoProfil} alt={`Foto profil ${person.name}`} />
      ) : <Avatar name={person.name} size={46} />}
      <div className={friendStyles.copy}>
        <strong>{person.name}</strong>
        <span>{person.jurusan ? `${person.userType === "DOSEN" ? "Dosen" : "Mahasiswa"} ${person.jurusan}` : `@${person.username}`}</span>
        <RoleBadge role={person.role} userType={person.userType} />
      </div>
      <FriendRequestButton userId={person.id} initialRelation={person.relation} />
    </article>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const [posts, people, newsItems] = query
    ? await Promise.all([searchPosts(query), searchPeople(query), Promise.resolve([])])
    : await Promise.all([Promise.resolve([]), Promise.resolve([]), getAdminNews()]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Link href="/beranda" className={styles.backButton} aria-label="Kembali ke beranda">
          <ArrowLeft size={38} strokeWidth={2.5} aria-hidden="true" />
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full.svg" alt="Concordia" className={styles.logo} />

        <SearchForm initialQuery={query} />

        <nav className={styles.tabs} aria-label="Kategori pencarian">
          {tabs.map((tab) => {
            const href = query
              ? tab.label === "Postingan"
                ? `/search?q=${encodeURIComponent(query)}#posts-heading`
                : tab.label === "Person"
                ? `/search?q=${encodeURIComponent(query)}#people-heading`
                : `/search?q=${encodeURIComponent(query)}`
              : tab.href;
            return (
              <Link key={tab.label} href={href} className={styles.tab}>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </section>

      {query ? (
        <div className={styles.results}>
          <section className={styles.section} aria-labelledby="posts-heading">
            <div className={styles.sectionHeading}><h1 id="posts-heading">Postingan</h1><span>{posts.length} hasil</span></div>
            {posts.length > 0 ? posts.map((post) => <PostCard key={post.id} post={post} viewerRole={user.role} viewerId={user.id} />) : <p className={styles.empty}>Tidak ada postingan yang cocok.</p>}
          </section>
          <section className={styles.section} aria-labelledby="people-heading">
            <div className={styles.sectionHeading}><h2 id="people-heading">Orang</h2><span>{people.length} hasil</span></div>
            {people.length > 0 ? people.map((person) => <PersonResult key={person.id} person={person} />) : <p className={styles.empty}>Tidak ada orang yang cocok.</p>}
          </section>
        </div>
      ) : (
        <div className={styles.landing}>
          <section className={styles.newsSection} aria-labelledby="news-heading">
            <h1 id="news-heading">Berita Hari Ini</h1>
            {newsItems.length > 0 ? newsItems.slice(0, 3).map((item) => (
              <div key={item.id} className={styles.newsRow}>
                <strong>{item.title}</strong>
                <span><UserRound size={20} fill="currentColor" aria-hidden="true" />{item.authorName} ({item.timeAgo})</span>
              </div>
            )) : <p className={styles.empty}>Belum ada berita hari ini.</p>}
          </section>

          <SearchHistory />
        </div>
      )}
    </div>
  );
}

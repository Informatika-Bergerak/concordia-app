import Link from "next/link";
import { Heart } from "lucide-react";
import { PostCard } from "@/components/forum/post-card";
import { getCurrentUser } from "@/lib/auth/guards";
import { getLikedPosts } from "@/modules/forum/queries";
import styles from "./disukai.module.css";

export default async function DiSukaiPage() {
  const [posts, user] = await Promise.all([getLikedPosts(), getCurrentUser()]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Postingan yang Disukai</h1>
        {posts.length > 0 && <span className={styles.count}>{posts.length} postingan</span>}
      </header>

      {posts.length > 0 ? posts.map((post) => (
        <PostCard key={post.id} post={post} viewerRole={user?.role} />
      )) : (
        <section className={styles.empty} aria-labelledby="liked-empty-title">
          <span className={styles.emptyIcon} aria-hidden="true"><Heart size={26} /></span>
          <h2 id="liked-empty-title" className={styles.emptyTitle}>Belum ada postingan yang disukai</h2>
          <p className={styles.emptyText}>Postingan yang kamu sukai akan muncul di halaman ini.</p>
          <Link href="/beranda" className={styles.link}>Jelajahi beranda</Link>
        </section>
      )}
    </div>
  );
}

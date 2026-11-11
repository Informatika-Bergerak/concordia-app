import { Composer } from "@/components/forum/composer";
import { PostCard } from "@/components/forum/post-card";
import { getFeed } from "@/modules/forum/queries";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function BerandaPage() {
  const [posts, user] = await Promise.all([getFeed(), getCurrentUser()]);

  return (
    <>
      <Composer />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewerRole={user?.role} />
      ))}
    </>
  );
}
import { Composer } from "@/components/forum/composer";
import { PostCard } from "@/components/forum/post-card";
import { getFeed } from "@/modules/forum/queries";

export default async function BerandaPage() {
  const posts = await getFeed();

  return (
    <>
      <Composer />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}
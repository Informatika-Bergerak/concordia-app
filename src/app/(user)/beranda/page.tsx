import { Composer } from "@/components/forum/composer";
import { PostCard } from "@/components/forum/post-card";
import { getFeed } from "@/modules/forum/queries";
import { getCurrentUser } from "@/lib/auth/guards";
import { mockEvents } from "@/modules/event/mock";

export default async function BerandaPage() {
  const [posts, user] = await Promise.all([getFeed(), getCurrentUser()]);

  return (
    <>
      <Composer user={{ name: user?.name ?? "Pengguna", fotoProfil: user?.fotoProfil }} events={mockEvents.map(({ title, startDate: date, startTime: time, location }) => ({ title, date, time, location }))} />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewerRole={user?.role} viewerId={user?.id} />
      ))}
    </>
  );
}
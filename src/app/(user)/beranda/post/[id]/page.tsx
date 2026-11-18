import { notFound } from "next/navigation";
import { ForumPostDetail } from "@/components/forum/forum-post-detail";
import { requireRole } from "@/lib/auth/guards";
import { getPostById } from "@/modules/forum/queries";

export default async function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  return <ForumPostDetail post={post} viewerRole={user.role} viewerId={user.id} />;
}

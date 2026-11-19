import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { ProfilePage } from "@/components/profile/profile-page";
import { getPostsByAuthor, getLikedPostsByUser, getRepliesByAuthor } from "@/modules/forum/queries";
import { getPublicGroupsByUser } from "@/modules/group/queries";

const VALID_TABS = ["threads", "liked", "replies", "groups"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function ProfilPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const rawTab = params.tab ?? "threads";
  const tab: Tab = (VALID_TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : "threads";

  const [threads, liked, replies, groups] = await Promise.all([
    tab === "threads" ? getPostsByAuthor(user.id) : Promise.resolve([]),
    tab === "liked" ? getLikedPostsByUser(user.id) : Promise.resolve([]),
    tab === "replies" ? getRepliesByAuthor(user.id) : Promise.resolve([]),
    tab === "groups" ? getPublicGroupsByUser(user.id) : Promise.resolve([]),
  ]);

  return (
    <ProfilePage
      user={{
        id: user.id,
        username: user.username,
        name: user.officialName,
        nickname: user.nickname,
        role: user.role,
        userType: user.userType,
        fotoProfil: user.fotoProfil,
        jurusan: user.jurusan,
        trustScore: user.trustScore,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }}
      viewerId={user.id}
      viewerRole={user.role}
      tab={tab}
      threads={threads}
      liked={liked}
      replies={replies}
      groups={groups}
      isOwnProfile={true}
    />
  );
}

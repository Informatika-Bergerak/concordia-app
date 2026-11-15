import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getGroupDetail, getGroupMessages } from "@/modules/group/queries";
import { GroupChat } from "@/components/group/group-chat";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GroupChatPage({ params }: Props) {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const { id } = await params;
  const groupId = Number(id);

  if (!Number.isInteger(groupId) || groupId <= 0) notFound();

  const group = await getGroupDetail(groupId, user.id);
  if (!group) notFound();

  const messages = await getGroupMessages(groupId, user.id);

  return <GroupChat group={group} messages={messages} currentUserId={user.id} />;
}

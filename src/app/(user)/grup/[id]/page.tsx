import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getGroupDetail, getGroupMessages, getGroupMembers } from "@/modules/group/queries";
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

  const [messages, members] = await Promise.all([
    getGroupMessages(groupId, user.id),
    getGroupMembers(groupId, user.id),
  ]);
  const currentMember = members.find((member) => member.userId === user.id);
  const canManage = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  return <GroupChat group={group} messages={messages} currentUserId={user.id} members={members} canManage={canManage} />;
}

import { requireRole } from "@/lib/auth/guards";
import { getUserGroups } from "@/modules/group/queries";
import { GroupListPage } from "@/components/group/group-list";

export default async function GrupPage() {
  const { user } = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  const groups = await getUserGroups(user.id);

  return <GroupListPage groups={groups} />;
}

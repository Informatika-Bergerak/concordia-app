import { ReportForm } from "@/components/report/report-form";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export default async function BuatLaporanPage({ searchParams }: { searchParams: Promise<{ groupId?: string; groupName?: string }> }) {
  // Admin hanya memverifikasi laporan, tidak membuatnya.
  const { user } = await requireRole(["USER", "MODERATOR"]);
  const params = await searchParams;
  const groupId = params.groupId ? Number(params.groupId) : undefined;
  const group = groupId && Number.isInteger(groupId) && groupId > 0
    ? await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, name: true } })
    : null;
  return <ReportForm viewerRole={user.role} groupReport={group ? { id: group.id, name: group.name } : undefined} />;
}

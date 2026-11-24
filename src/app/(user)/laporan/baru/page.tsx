import { ReportForm } from "@/components/report/report-form";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export default async function BuatLaporanPage({ searchParams }: { searchParams: Promise<{ groupId?: string; groupName?: string; eventTitle?: string; eventLocation?: string; eventDate?: string; eventReason?: string; eventDescription?: string }> }) {
  // Admin hanya memverifikasi laporan, tidak membuatnya.
  const { user } = await requireRole(["USER", "MODERATOR"]);
  const params = await searchParams;
  const groupId = params.groupId ? Number(params.groupId) : undefined;
  const group = groupId && Number.isInteger(groupId) && groupId > 0
    ? await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, name: true } })
    : null;
  const eventReport = params.eventTitle ? {
    title: `Laporan Event: ${params.eventTitle}`,
    location: params.eventLocation ?? params.eventTitle,
    occurredAt: params.eventDate,
    description: params.eventReason ? `Alasan: ${params.eventReason}${params.eventDescription ? `\n\nKeterangan: ${params.eventDescription}` : ""}` : undefined,
  } : undefined;
  return <ReportForm viewerRole={user.role} groupReport={group ? { id: group.id, name: group.name } : undefined} eventReport={eventReport} />;
}

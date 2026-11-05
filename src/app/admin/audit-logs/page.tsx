import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { getAuditLogs } from "@/lib/audit/queries";
import { LogsDataTable, type SerializedAuditLog } from "./logs-data-table";
import styles from "./logs.module.css";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    action?: string;
    q?: string;
  }>;
}

export default async function AdminAuditLogsPage(props: PageProps) {
  const { user: admin } = await requireRole(["ADMIN"]);

  const searchParams = await props.searchParams;
  const rawPage = Number(searchParams.page);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawPageSize = Number(searchParams.pageSize);
  const pageSize = [10, 25, 50, 100].includes(rawPageSize) ? rawPageSize : 10;

  const selectedAction = searchParams.action ?? "";
  const query = searchParams.q ?? "";

  const { logs, total, totalPages } = await getAuditLogs({
    page,
    pageSize,
    action: selectedAction,
    q: query,
  });

  // Serialisasi data log agar aman dikirim ke Client Component
  const serializedLogs: SerializedAuditLog[] = logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
    action: log.action,
    actorId: log.actorId,
    actorUsername: log.actorUsername,
    targetId: log.targetId,
    targetUsername: log.targetUsername,
    ip: log.ip,
    userAgent: log.userAgent,
    metadata: log.metadata,
  }));

  return (
    <AppShell user={admin}>
      <div className={styles.container}>
        <div>
          <h1 className="page-title">Log Aktivitas</h1>
          <p className="page-sub">
            Catatan audit kejadian penting sistem, autentikasi, dan aksi administratif.
          </p>
        </div>

        {/* DataTables Modern Responsive dengan Realtime Filter & Show Entries */}
        <LogsDataTable
          logs={serializedLogs}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          pageSize={pageSize}
          currentAction={selectedAction}
          currentQuery={query}
        />
      </div>
    </AppShell>
  );
}


import "server-only";

import { prisma } from "@/lib/db";
import type { AuditAction } from "@/generated/prisma/enums";

const VALID_ACTIONS = new Set<string>([
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGIN_LOCKED",
  "LOGIN_DEVICE_REJECTED",
  "LOGOUT",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "ACCOUNT_CREATED",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_DEACTIVATED",
  "SESSION_REVOKED",
]);

export interface GetAuditLogsParams {
  page: number;
  pageSize?: number;
  action?: string;
  q?: string;
}

export interface AuditLogRow {
  id: number;
  createdAt: Date;
  action: AuditAction;
  actorId: number | null;
  actorUsername: string | null;
  targetId: number | null;
  targetUsername: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
}

export interface GetAuditLogsResult {
  logs: AuditLogRow[];
  total: number;
  totalPages: number;
}

export async function getAuditLogs({
  page,
  pageSize = 20,
  action,
  q,
}: GetAuditLogsParams): Promise<GetAuditLogsResult> {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  // Validasi action — abaikan nilai yang tidak valid
  const validAction =
    action && VALID_ACTIONS.has(action) ? (action as AuditAction) : undefined;

  // Sanitasi q — maksimal 64 karakter
  const safeQ = q ? q.slice(0, 64) : undefined;

  const where = {
    ...(validAction ? { action: validAction } : {}),
    ...(safeQ
      ? {
          OR: [
            { actorUsername: { contains: safeQ, mode: "insensitive" as const } },
            { targetUsername: { contains: safeQ, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

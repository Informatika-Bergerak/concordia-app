import "server-only";

import { prisma } from "@/lib/db";
import type { AuditAction } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

export interface LogAuditInput {
  action: AuditAction;
  actor?: { id: number; username: string } | null;
  target?: { id: number; username: string } | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const ua = input.userAgent ? input.userAgent.slice(0, 255) : null;

    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actor?.id ?? null,
        actorUsername: input.actor?.username ?? null,
        targetId: input.target?.id ?? null,
        targetUsername: input.target?.username ?? null,
        ip: input.ip ?? null,
        userAgent: ua,
        metadata: input.metadata !== undefined ? input.metadata : Prisma.JsonNull,
      },
    });
  } catch (err) {
    // Gagal mencatat log tidak boleh menghentikan alur utama
    console.error("[audit] Gagal mencatat log:", (err as Error).message);
  }
}

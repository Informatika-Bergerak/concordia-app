import type { AuditAction } from "@/generated/prisma/enums";

export const auditLabels: Record<AuditAction, string> = {
  LOGIN_SUCCESS: "Login berhasil",
  LOGIN_FAILED: "Login gagal",
  LOGIN_LOCKED: "Akun terkunci (terlalu banyak percobaan)",
  LOGIN_DEVICE_REJECTED: "Login ditolak (perangkat lain aktif)",
  LOGOUT: "Logout",
  PASSWORD_CHANGED: "Password diubah",
  PASSWORD_RESET: "Password direset admin",
  ACCOUNT_CREATED: "Akun dibuat",
  ACCOUNT_ACTIVATED: "Akun diaktifkan",
  ACCOUNT_DEACTIVATED: "Akun dinonaktifkan",
  SESSION_REVOKED: "Sesi dicabut paksa",
};

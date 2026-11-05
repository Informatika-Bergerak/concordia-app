import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  buildKeys,
  clearFailures,
  getClientIp,
  isLocked,
  recordFailure,
} from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit/log";
import { metaFromRequest } from "@/lib/audit/request-meta";
import { SESSION_IDLE_MINUTES } from "@/lib/auth/session-config";

// Dibedakan dari "password salah" supaya halaman login bisa menampilkan pesan tepat
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

// Login ditolak karena akun sedang aktif di perangkat lain
class DeviceInUseError extends CredentialsSignin {
  code = "device_in_use";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 hari
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(raw, request) {
        // 1. Validasi format input
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;

        const keys = buildKeys(username, getClientIp(request));
        const meta = metaFromRequest(request);

        // 2. Cek apakah sedang terkunci — tolak tanpa memeriksa password
        if (await isLocked(keys)) throw new RateLimitedError();

        // 3. Cari akun dan verifikasi password
        const user = await prisma.user.findUnique({ where: { username } });
        const valid =
          user?.isActive
            ? await bcrypt.compare(password, user.passwordHash)
            : false;

        // 4. Gagal login
        if (!user || !valid) {
          const lockedNow = await recordFailure(keys);

          if (!user) {
            // Username tidak terdaftar — JANGAN simpan username yang diketik (privasi)
            await logAudit({
              action: "LOGIN_FAILED",
              actor: null,
              ip: meta.ip,
              userAgent: meta.userAgent,
              metadata: { reason: "unknown_username" },
            });
          } else {
            // Akun ada tapi password salah
            await logAudit({
              action: "LOGIN_FAILED",
              actor: { id: user.id, username: user.username },
              ip: meta.ip,
              userAgent: meta.userAgent,
            });
          }

          // Catat LOGIN_LOCKED hanya saat penguncian baru terjadi
          if (lockedNow && user) {
            await logAudit({
              action: "LOGIN_LOCKED",
              actor: { id: user.id, username: user.username },
              ip: meta.ip,
              userAgent: meta.userAgent,
            });
          }

          if (lockedNow) throw new RateLimitedError();
          return null;
        }

        // 5. Password benar — klaim slot sesi secara atomik
        const sid = crypto.randomUUID();
        const cutoff = new Date(Date.now() - SESSION_IDLE_MINUTES * 60 * 1000);
        const deviceLabel = meta.userAgent ?? "Perangkat tidak dikenal";

        const claimed = await prisma.user.updateMany({
          where: {
            id: user.id,
            OR: [
              { activeSessionId: null },
              { lastSeenAt: null },
              { lastSeenAt: { lt: cutoff } },
            ],
          },
          data: {
            activeSessionId: sid,
            lastSeenAt: new Date(),
            activeDevice: deviceLabel,
          },
        });

        // 6. Klaim gagal — ada perangkat lain yang masih aktif
        if (claimed.count === 0) {
          await logAudit({
            action: "LOGIN_DEVICE_REJECTED",
            actor: { id: user.id, username: user.username },
            ip: meta.ip,
            userAgent: meta.userAgent,
          });
          // Bukan percobaan gagal (password benar), jadi tidak menambah hitungan
          throw new DeviceInUseError();
        }

        // 7. Login berhasil
        await clearFailures(username);
        await logAudit({
          action: "LOGIN_SUCCESS",
          actor: { id: user.id, username: user.username },
          ip: meta.ip,
          userAgent: meta.userAgent,
        });

        return {
          id: String(user.id),
          name: user.name,
          username: user.username,
          role: user.role,
          userType: user.userType,
          sid,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.userType = user.userType;
        token.username = user.username;
        token.sid = user.sid;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.userType = token.userType;
      session.user.username = token.username;
      session.user.sid = token.sid;
      return session;
    },
  },
  events: {
    async signOut(message) {
      // Hanya berlaku untuk JWT session (bukan database session)
      if (!("token" in message) || !message.token) return;

      const token = message.token;
      const userId = Number(token.id);
      const sid = token.sid;

      if (!Number.isInteger(userId) || !sid) return;

      // Kosongkan sesi hanya jika sid di database cocok (jangan hapus sesi perangkat lain)
      await prisma.user.updateMany({
        where: { id: userId, activeSessionId: sid },
        data: { activeSessionId: null, lastSeenAt: null, activeDevice: null },
      });

      await logAudit({
        action: "LOGOUT",
        actor: { id: userId, username: typeof token.username === "string" ? token.username : "" },
      });
    },
  },
});

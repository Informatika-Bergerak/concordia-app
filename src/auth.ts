import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { buildKeys, clearFailures, getClientIp, isLocked, recordFailure } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth";

// Kode khusus supaya halaman login bisa membedakan "terkunci" dari "password salah"
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 hari
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;

        const keys = buildKeys(username, getClientIp(request));

        // 1. Sedang terkunci? Tolak tanpa memeriksa password sama sekali
        if (await isLocked(keys)) throw new RateLimitedError();

        // 2. Periksa kredensial
        const user = await prisma.user.findUnique({ where: { username } });
        const valid = user?.isActive
          ? await bcrypt.compare(password, user.passwordHash)
          : false;

        // 3. Gagal: catat. Username yang tidak ada juga dicatat, supaya pola
        //    penguncian tidak membocorkan username mana yang terdaftar
        if (!user || !valid) {
          const lockedNow = await recordFailure(keys);
          if (lockedNow) throw new RateLimitedError();
          return null;
        }

        // 4. Berhasil: reset hitungan gagal untuk username ini
        await clearFailures(username);

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          userType: user.userType,
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
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.userType = token.userType;
      session.user.username = token.username;
      return session;
    },
  },
});
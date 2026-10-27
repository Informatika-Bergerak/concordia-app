import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Role, UserType } from "../src/generated/prisma/enums";
import { passwordSchema } from "../src/lib/validations/auth";
import { dosen, mahasiswa } from "./seed-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Account = {
  username: string;
  name: string;
  role: Role;
  userType: UserType | null;
  password: string;
};

function getPassword(envName: string): string {
  const value = process.env[envName];
  if (!value) throw new Error(`${envName} belum diisi di .env`);
  const result = passwordSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`${envName} tidak valid: ${result.error.issues[0].message}`);
  }
  return value;
}

async function main() {
  const adminPassword = getPassword("SEED_ADMIN_PASSWORD");
  const moderatorPassword = getPassword("SEED_MODERATOR_PASSWORD");
  const userPassword = getPassword("SEED_USER_PASSWORD");

  const accounts: Account[] = [
    { username: "admin", name: "Administrator", role: "ADMIN", userType: null, password: adminPassword },
    { username: "moderator", name: "Moderator", role: "MODERATOR", userType: null, password: moderatorPassword },
    ...[...mahasiswa, ...dosen].map((u) => ({
      ...u,
      role: "USER" as const,
      password: userPassword,
    })),
  ];

  for (const acc of accounts) {
    const passwordHash = await bcrypt.hash(acc.password, 12);
    await prisma.user.upsert({
      where: { username: acc.username },
      // Saat seed diulang, password yang sudah diganti user TIDAK ikut di-reset
      update: { name: acc.name, role: acc.role, userType: acc.userType },
      create: {
        username: acc.username,
        name: acc.name,
        role: acc.role,
        userType: acc.userType,
        passwordHash,
      },
    });
  }

  console.log(`Seed selesai: ${accounts.length} akun`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
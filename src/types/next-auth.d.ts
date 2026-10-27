import type { DefaultSession } from "next-auth";
import type { Role, UserType } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    userType: UserType | null;
    username: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      userType: UserType | null;
      username: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    userType: UserType | null;
    username: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    userType: UserType | null;
    username: string;
  }
}
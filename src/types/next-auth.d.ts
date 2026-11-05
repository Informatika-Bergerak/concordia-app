import type { DefaultSession } from "next-auth";
import type { Role, UserType } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    userType: UserType | null;
    username: string;
    /** ID sesi aktif — UUID acak yang disimpan di JWT dan dicocokkan dengan database */
    sid: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      userType: UserType | null;
      username: string;
      sid: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/types" {
  interface User {
    role: Role;
    userType: UserType | null;
    username: string;
    sid: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      userType: UserType | null;
      username: string;
      sid: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    userType: UserType | null;
    username: string;
    sid: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    userType: UserType | null;
    username: string;
    sid: string;
  }
}

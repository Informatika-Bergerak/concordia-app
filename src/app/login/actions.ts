"use server";

import { headers } from "next/headers";
import { buildKeys, getIpFromHeaders, isLocked } from "@/lib/auth/rate-limit";

export async function isLoginLockedAction(username: string): Promise<boolean> {
  const name = String(username).trim().toLowerCase().slice(0, 64);
  if (!name) return false;

  const h = await headers();
  return isLocked(buildKeys(name, getIpFromHeaders(h)));
}
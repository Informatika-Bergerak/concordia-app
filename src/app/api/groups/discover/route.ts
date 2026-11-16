import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPublicGroups } from "@/modules/group/queries";
export async function GET(req: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const query = new URL(req.url).searchParams.get("q") ?? ""; return NextResponse.json({ groups: await getPublicGroups(user.id, query) }); }

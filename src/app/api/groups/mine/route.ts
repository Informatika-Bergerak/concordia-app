import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getUserGroups } from "@/modules/group/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getUserGroups(user.id), {
    headers: { "Cache-Control": "no-store" },
  });
}

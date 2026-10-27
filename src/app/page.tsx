import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homeByRole } from "@/lib/auth/routes";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(homeByRole[session.user.role]);
}
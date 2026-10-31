import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homeByRole[user.role]);
}
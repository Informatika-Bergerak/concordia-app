import { getCurrentUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { MenuContent } from "@/components/menu/menu-content";

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <MenuContent user={{ name: user.name, fotoProfil: user.fotoProfil, role: user.role, userType: user.userType }} />;
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { ProfilePage } from "@/components/profile/profile-page";

export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ProfilePage
      user={{
        username: user.username,
        name: user.name,
        role: user.role,
        userType: user.userType,
        fotoProfil: user.fotoProfil,
        trustScore: user.trustScore,
        isActive: user.isActive,
      }}
    />
  );
}

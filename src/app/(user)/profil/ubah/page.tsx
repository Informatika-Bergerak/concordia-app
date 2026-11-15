import { redirect } from "next/navigation";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function UbahProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <EditProfileForm
      user={{
        name: user.name,
        username: user.username,
        jurusan: user.jurusan,
        bio: user.bio,
        fotoProfil: user.fotoProfil,
        userType: user.userType,
        createdAt: user.createdAt,
      }}
    />
  );
}

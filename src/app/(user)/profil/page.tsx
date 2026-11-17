import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { ProfilePage } from "@/components/profile/profile-page";

export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const recommendations = await prisma.user.findMany({
    where: { id: { not: user.id }, isActive: true, role: "USER" },
    select: { id: true, name: true, nickname: true, jurusan: true, fotoProfil: true },
    orderBy: { name: "asc" },
    take: 3,
  });

  return (
    <ProfilePage
      recommendations={recommendations.map((person) => ({ ...person, name: person.nickname?.trim() || person.name }))}
      user={{
        username: user.username,
        name: user.officialName,
        nickname: user.nickname,
        role: user.role,
        userType: user.userType,
        fotoProfil: user.fotoProfil,
        jurusan: user.jurusan,
        trustScore: user.trustScore,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }}
    />
  );
}

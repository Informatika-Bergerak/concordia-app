import { getCurrentUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { EventPage } from "@/components/event/event-page";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <EventPage
      currentUser={{
        id: user.id,
        name: user.name,
        fotoProfil: user.fotoProfil,
        jurusan: user.jurusan,
        role: user.role,
      }}
    />
  );
}

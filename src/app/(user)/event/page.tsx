import { getCurrentUser } from "@/lib/auth/guards";
import { getEvents, getJoinedGroups } from "@/modules/event/queries";
import { redirect } from "next/navigation";
import { EventPage } from "@/components/event/event-page";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [events, joinedGroups] = await Promise.all([getEvents(user.id), getJoinedGroups(user.id)]);

  return (
    <EventPage
      initialEvents={events}
      joinedGroups={joinedGroups}
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

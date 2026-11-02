import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";
import { LandingClient } from "./landing-client";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(homeByRole[user.role]);

  return <LandingClient />;
}
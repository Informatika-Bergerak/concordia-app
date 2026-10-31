import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeByRole[user.role]);

  return (
    <main className="center-page">
      <LoginForm />
    </main>
  );
}
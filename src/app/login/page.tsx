import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homeByRole } from "@/lib/auth/routes";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect(homeByRole[session.user.role]);

  return (
    <main className="center-page">
      <LoginForm />
    </main>
  );
}
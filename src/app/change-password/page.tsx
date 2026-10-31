import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="center-page">
      <div>
        <ChangePasswordForm forced={user.mustChangePassword} />
        {!user.mustChangePassword && (
          <Link href={homeByRole[user.role]} className="link-muted">
            Kembali
          </Link>
        )}
      </div>
    </main>
  );
}
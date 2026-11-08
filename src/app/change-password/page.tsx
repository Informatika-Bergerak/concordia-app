import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";
import { ChangePasswordForm } from "./change-password-form";
import styles from "./change-password.module.css";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <ChangePasswordForm forced={user.mustChangePassword} />
        {!user.mustChangePassword && (
          <Link href={homeByRole[user.role]} className={styles.backLink}>
            Kembali
          </Link>
        )}
      </div>
    </main>
  );
}

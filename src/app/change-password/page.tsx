import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { ChangePasswordForm } from "./change-password-form";
import styles from "./change-password.module.css";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <ChangePasswordForm forced={user.mustChangePassword} role={user.role} />
      </div>
    </main>
  );
}

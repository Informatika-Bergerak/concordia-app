import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeByRole } from "@/lib/auth/routes";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeByRole[user.role]);

  return (
    <main className={styles.loginPage}>
      <div className={styles.desktopWrapper}>
        {/* Desktop left brand panel */}
        <div className={styles.brandPanel}>
          <Logo variant="full" size={80} />
          <p className={styles.brandTagline}>
            Platform Komunitas Kampus Terpadu
          </p>
        </div>

        {/* Form panel */}
        <div className={styles.formPanel}>
          {/* Mobile logo */}
          <div className={styles.logoArea}>
            <Logo variant="full" size={64} />
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
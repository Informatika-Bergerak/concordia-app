import type { ReactNode } from "react";
import { TopBar } from "./top-bar";
import styles from "./mobile-shell.module.css";

export function MobileShell({ userName, children }: { userName: string; children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <div className={styles.phone}>
        <TopBar userName={userName} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
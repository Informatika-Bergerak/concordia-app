"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import styles from "./landing.module.css";

export function LandingClient() {
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const timer = setTimeout(() => {
      router.push("/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.landing}>
      <div className={styles.logo}>
        <Logo variant="full" size={80} />
      </div>

      <a href="/login" className={styles.loginLink}>
        Masuk
      </a>

      <div className={styles.footer}>
        Powered by Informatika Bergerak @2026
      </div>
    </div>
  );
}

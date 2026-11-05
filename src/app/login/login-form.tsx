"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { isLoginLockedAction } from "./actions";
import styles from "./login.module.css";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "");

    const res = await signIn("credentials", {
      username,
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      if (res.code === "device_in_use") {
        setError(
          "Akun ini sedang digunakan di perangkat lain. Keluar dari perangkat tersebut atau coba lagi nanti.",
        );
        setLoading(false);
        return;
      }

      const locked = await isLoginLockedAction(username);
      setError(
        locked
          ? "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit."
          : "Username atau password salah",
      );
      setLoading(false);
      return;
    }
    window.location.href = "/";
  }

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h1 className={styles.title}>Log In To Concordia</h1>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.fieldGroup}>
        <label htmlFor="username" className={styles.fieldLabel}>
          NPM / NIDN
        </label>
        <div className={styles.fieldWrapper}>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className={styles.fieldInput}
            placeholder="Masukan NPM / NID..."
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="password" className={styles.fieldLabel}>
          Password
        </label>
        <div className={styles.fieldWrapper}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={styles.fieldInput}
            placeholder="Masukan Password..."
          />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Memproses..." : "Login"}
      </button>

      <button
        type="button"
        className={styles.forgotLink}
        onClick={() => setShowForgot((v) => !v)}
      >
        Forgot Password
      </button>

      {showForgot && (
        <div className={styles.forgotPanel}>
          Hubungi admin untuk mereset password.
        </div>
      )}

      <div className={styles.loginFooter}>Personalized By Informatika Bergerak</div>
    </form>
  );
}

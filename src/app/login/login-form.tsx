"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { isLoginLockedAction } from "./actions";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <form className="login-card" onSubmit={onSubmit}>
      <h1>ConCordia</h1>
      <p className="sub">Masuk dengan NPM / NIDN / username</p>

      {error && <p className="error-text">{error}</p>}

      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" required />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
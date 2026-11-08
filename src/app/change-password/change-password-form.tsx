"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";
import styles from "./change-password.module.css";

const initial: ChangePasswordState = {};

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial);

  return (
    <form action={formAction} className={styles.card}>
      <h1 className={styles.title}>Ganti password</h1>
      <p className={styles.sub}>
        {forced
          ? "Demi keamanan, kamu wajib mengganti password sementara sebelum melanjutkan."
          : "Masukkan password lama dan password baru."}
      </p>

      {state.error && <div className={styles.errorAlert}>{state.error}</div>}

      <div className={styles.field}>
        <label htmlFor="currentPassword" className={styles.label}>
          Password lama
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="newPassword" className={styles.label}>
          Password baru
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Konfirmasi password baru
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          required
        />
      </div>

      <p className={styles.hint}>
        Minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus.
      </p>

      <button type="submit" className={styles.submitBtn} disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan password"}
      </button>
    </form>
  );
}

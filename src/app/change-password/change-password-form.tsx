"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import { homeByRole } from "@/lib/auth/routes";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAction, type ChangePasswordState } from "./actions";
import styles from "./change-password.module.css";

const initial: ChangePasswordState = {};

function PasswordField({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={styles.input}
          required
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setVisible((prev) => !prev)}
          aria-label={
            visible
              ? `Sembunyikan ${label.toLowerCase()}`
              : `Tampilkan ${label.toLowerCase()}`
          }
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordForm({ forced, role }: { forced: boolean; role: Role }) {
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

      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="Password lama"
        autoComplete="current-password"
      />

      <PasswordField
        id="newPassword"
        name="newPassword"
        label="Password baru"
        autoComplete="new-password"
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Konfirmasi password baru"
        autoComplete="new-password"
      />

      <p className={styles.hint}>
        Minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus.
      </p>

      <button type="submit" className={styles.submitBtn} disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan password"}
      </button>
      {!forced && <Link href={homeByRole[role]} className={styles.backLink}>Kembali</Link>}
    </form>
  );
}

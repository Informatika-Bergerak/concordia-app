"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initial: ChangePasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan password"}
    </button>
  );
}

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction] = useFormState(changePasswordAction, initial);

  return (
    <form action={formAction} className="login-card">
      <h1>Ganti password</h1>
      <p className="sub">
        {forced
          ? "Demi keamanan, kamu wajib mengganti password sementara sebelum melanjutkan."
          : "Masukkan password lama dan password baru."}
      </p>

      {state.error && <p className="error-text">{state.error}</p>}

      <div className="field">
        <label htmlFor="currentPassword">Password lama</label>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>

      <div className="field">
        <label htmlFor="newPassword">Password baru</label>
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
      </div>

      <div className="field">
        <label htmlFor="confirmPassword">Konfirmasi password baru</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </div>

      <p className="hint">
        Minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus.
      </p>

      <SubmitButton />
    </form>
  );
}
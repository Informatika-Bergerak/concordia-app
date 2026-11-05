"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "./actions";
import styles from "./reset-password.module.css";

export function ResetPasswordButton({ userId, username }: { userId: number; username: string }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function onClick() {
    if (!window.confirm(`Reset password untuk ${username}?`)) return;
    setError("");
    setPassword(null);
    setCopied(false);

    startTransition(async () => {
      const res = await resetPasswordAction(userId);
      if (res.error) setError(res.error);
      else setPassword(res.password ?? null);
    });
  }

  function onCopy() {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function onClose() {
    setPassword(null);
    setError("");
    setCopied(false);
  }

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={onClick} disabled={pending}>
        {pending ? "Memproses..." : "Reset password"}
      </button>

      {error && <span className="error-inline">{error}</span>}

      {password && (
        <div className={styles.overlay} onClick={onClose}>
          <div className={styles.card} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2 className={styles.title}>Password Berhasil Direset</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                ✕
              </button>
            </div>

            <p className={styles.sub}>
              Bagikan password sementara ini kepada <strong>{username}</strong>. Password hanya tampil sekali.
            </p>

            <div className={styles.passwordRow}>
              <code className={styles.secret}>{password}</code>
              <button type="button" className={styles.copyBtn} onClick={onCopy}>
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>

            <p className={styles.hint}>
              Pengguna akan diminta mengganti password saat login pertama kali.
            </p>

            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Selesai
            </button>
          </div>
        </div>
      )}
    </>
  );
}

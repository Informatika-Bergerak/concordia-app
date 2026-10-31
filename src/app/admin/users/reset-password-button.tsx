"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "./actions";

export function ResetPasswordButton({ userId, username }: { userId: string; username: string }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");

  function onClick() {
    if (!window.confirm(`Reset password untuk ${username}?`)) return;
    setError("");
    setPassword(null);

    startTransition(async () => {
      const res = await resetPasswordAction(userId);
      if (res.error) setError(res.error);
      else setPassword(res.password ?? null);
    });
  }

  return (
    <div className="row-actions">
      <button type="button" className="btn btn-ghost" onClick={onClick} disabled={pending}>
        {pending ? "Memproses..." : "Reset password"}
      </button>
      {password && <code className="secret">{password}</code>}
      {error && <span className="error-inline">{error}</span>}
    </div>
  );
}
"use client";

import { useState, useTransition } from "react";
import { updateUserProfileAction } from "./actions";

export function EditUserForm({
  user,
}: {
  user: { id: number; name: string; nickname: string | null; username: string; userType: "MAHASISWA" | "DOSEN" | null; jurusan: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [username, setUsername] = useState(user.username);
  const [userType, setUserType] = useState<"MAHASISWA" | "DOSEN" | null>(user.userType);
  const [jurusan, setJurusan] = useState(user.jurusan ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserProfileAction({ id: user.id, name, nickname, username, userType, jurusan });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  if (!open) return <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>Edit profil</button>;

  return (
    <div style={{ minWidth: 280, display: "grid", gap: 8, padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" aria-label="Nama lengkap" />
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" aria-label="Nickname" maxLength={50} />
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="NPM / NIDN" aria-label="NPM atau NIDN" />
      <select value={userType ?? ""} onChange={(e) => setUserType((e.target.value || null) as "MAHASISWA" | "DOSEN" | null)} aria-label="Status">
        <option value="">Tidak ditentukan</option>
        <option value="MAHASISWA">Mahasiswa</option>
        <option value="DOSEN">Dosen</option>
      </select>
      <input value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan" aria-label="Jurusan" />
      {error && <small style={{ color: "var(--danger)" }}>{error}</small>}
      <div className="actions-cell">
        <button type="button" className="btn btn-primary" onClick={submit} disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Batal</button>
      </div>
    </div>
  );
}

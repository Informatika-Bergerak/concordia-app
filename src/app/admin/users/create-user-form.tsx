"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "./actions";

const initial: CreateUserState = {};

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initial);

  return (
    <form action={formAction} className="card form-card">
      <h3 style={{ marginBottom: 16 }}>Buat akun baru</h3>

      {state.error && <p className="error-text">{state.error}</p>}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Nama lengkap</label>
          <input
            id="name"
            name="name"
            required
            defaultValue={state.created ? "" : (state.values?.name ?? "")}
          />
        </div>

        <div className="field">
          <label htmlFor="username">Username (NPM / NIDN)</label>
          <input
            id="username"
            name="username"
            required
            defaultValue={state.created ? "" : (state.values?.username ?? "")}
          />
        </div>

        <div className="field">
          <label htmlFor="accountType">Tipe akun</label>
          <select
            id="accountType"
            name="accountType"
            required
            defaultValue={state.created ? "MAHASISWA" : (state.values?.accountType ?? "MAHASISWA")}
          >
            <option value="MAHASISWA">Mahasiswa</option>
            <option value="DOSEN">Dosen</option>
            <option value="MODERATOR">Moderator</option>
          </select>
        </div>

        <div className="field">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Membuat..." : "Buat akun"}
          </button>
        </div>
      </div>

      {state.created && (
        <div className="success-box">
          Akun <strong>{state.created.name}</strong> dibuat. Username:{" "}
          <strong>{state.created.username}</strong>, password sementara:{" "}
          <code className="secret">{state.created.password}</code>
          <br />
          Catat sekarang. Password ini tidak akan ditampilkan lagi.
        </div>
      )}
    </form>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, ImagePlus, UserRound } from "lucide-react";
import { signOut } from "next-auth/react";
import { uploadFile, type UploadResult } from "@/lib/uploads/client";
import { UPLOAD_RULES } from "@/lib/uploads/config";
import { updateProfileAction } from "@/app/(user)/profil/ubah/actions";
import styles from "./edit-profile.module.css";

type EditProfileUser = {
  name: string;
  username: string;
  jurusan: string | null;
  bio: string | null;
  fotoProfil: string | null;
  userType: "MAHASISWA" | "DOSEN" | null;
  createdAt: Date;
};

export function EditProfileForm({ user }: { user: EditProfileUser }) {
  const [name, setName] = useState(user.name);
  const [jurusan, setJurusan] = useState(user.jurusan ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [photo, setPhoto] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState(user.fotoProfil);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const rule = UPLOAD_RULES.image;
    if (!rule.mimes.includes(file.type)) {
      setError(`Format foto harus ${rule.label}.`);
      event.target.value = "";
      return;
    }
    if (file.size > rule.maxBytes) {
      setError(`Ukuran foto maksimal ${rule.maxBytes / 1024 / 1024} MB.`);
      event.target.value = "";
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    startTransition(async () => {
      try {
        const result = await uploadFile(file, "avatars");
        setPhoto(result);
        setPreview(result.url);
      } catch (uploadError) {
        setPreview(user.fotoProfil);
        setError(uploadError instanceof Error ? uploadError.message : "Gagal mengunggah foto");
      }
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await updateProfileAction({
        name,
        jurusan,
        bio,
        fotoProfil: photo?.url,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Profil berhasil disimpan.");
      window.setTimeout(() => { window.location.href = "/profil"; }, 400);
    });
  }

  return (
    <form className={styles.page} onSubmit={submit}>
      <header className={styles.header}>
        <Link href="/profil" className={styles.backButton} aria-label="Kembali ke profil">
          <ArrowLeft size={32} aria-hidden="true" />
        </Link>
        <h1>Edit Profil</h1>
        <button type="submit" className={styles.saveButton} disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
      </header>

      <main className={styles.card}>
        <div className={styles.cover}>
          <label className={styles.coverUpload}>
            <ImagePlus size={56} strokeWidth={1.6} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Ganti foto profil</span>
            <input type="file" accept={UPLOAD_RULES.image.mimes.join(",")} onChange={handlePhoto} disabled={pending} />
          </label>
        </div>
        <div className={styles.body}>
          <div className={styles.avatar}>
            {preview ? (
              // URL is returned by the validated upload endpoint or existing profile data.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={`Foto profil ${name}`} />
            ) : <UserRound size={68} aria-hidden="true" />}
          </div>

          <section className={styles.identity} aria-labelledby="edit-profile-name">
            <h2 id="edit-profile-name">{name || "Nama pengguna"}</h2>
            <p>{user.userType === "DOSEN" ? "Dosen" : "Mahasiswa"}{jurusan ? ` - ${jurusan}` : ""}</p>
            <p className={styles.joined}><CalendarDays size={18} aria-hidden="true" /> Joined {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(user.createdAt)}</p>
          </section>

          <section className={styles.formSection} aria-labelledby="intro-title">
            <h2 id="intro-title">Intro</h2>
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Beri deskripsi tentang anda...." maxLength={300} disabled={pending} />
          </section>

          <section className={styles.formSection} aria-labelledby="detail-title">
            <h2 id="detail-title">Detail Pribadi</h2>
            <label htmlFor="name">Nama Lengkap</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} disabled={pending} />
            <label htmlFor="nim">NIM</label>
            <input id="nim" value={user.username} readOnly aria-readonly="true" />
            <label htmlFor="status">Status</label>
            <input id="status" value={user.userType === "DOSEN" ? "Dosen" : "Mahasiswa"} readOnly aria-readonly="true" />
            <label htmlFor="jurusan">Jurusan</label>
            <input id="jurusan" value={jurusan} onChange={(event) => setJurusan(event.target.value)} disabled={pending} />
            <label htmlFor="email">Email</label>
            <input id="email" value={`${user.username}@concordia.local`} readOnly aria-readonly="true" />
          </section>

          {error && <p className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}

          <section className={styles.account} aria-labelledby="account-title">
            <h2 id="account-title">Akun Anda</h2>
            <Link href="/change-password" className={styles.accountLink}>Ubah Kata Sandi Anda</Link>
            <button type="button" className={styles.logoutButton} onClick={() => signOut({ redirectTo: "/login" })}>Keluar dari akun</button>
          </section>
        </div>
      </main>
    </form>
  );
}

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="center-page">
      <div className="login-card">
        <h1>Akses ditolak</h1>
        <p className="sub">Akun kamu tidak punya izin untuk membuka halaman ini.</p>
        <Link href="/" className="btn">Kembali</Link>
      </div>
    </main>
  );
}
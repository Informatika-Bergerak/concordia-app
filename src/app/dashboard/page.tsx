import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";

const modules = [
  { title: "Aktivitas", desc: "Kegiatan dan agenda perkuliahan." },
  { title: "Forum", desc: "Diskusi antar mahasiswa dan dosen." },
  { title: "Laporan", desc: "Pelaporan dan pengaduan." },
  { title: "Trust", desc: "Skor kepercayaan dan reputasi." },
];

export default async function DashboardPage() {
  const session = await requireRole(["USER"]);
  const { user } = session;
  const idLabel = user.userType === "DOSEN" ? "NIDN" : "NPM";

  return (
    <AppShell user={user}>
      <h1 className="page-title">Halo, {user.name}</h1>
      <p className="page-sub">Selamat datang di ConCordia.</p>

      <div className="notice">Tampilan sementara. Modul di bawah akan diisi bertahap.</div>

      <div className="grid">
        {modules.map((m) => (
          <div className="card" key={m.title}>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Profil</h3>
        <div className="profile-row"><span>Nama</span><span>{user.name}</span></div>
        <div className="profile-row"><span>{idLabel}</span><span>{user.username}</span></div>
        <div className="profile-row">
          <span>Tipe</span>
          <span>{user.userType === "DOSEN" ? "Dosen" : "Mahasiswa"}</span>
        </div>
      </div>
    </AppShell>
  );
}
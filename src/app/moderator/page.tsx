import { AppShell } from "@/components/app-shell";
import { requireRole } from "../../lib/auth/guards";

const sections = [
  { title: "Laporan masuk", desc: "Laporan yang menunggu ditinjau.", num: 0 },
  { title: "Konten ditandai", desc: "Postingan forum yang dilaporkan.", num: 0 },
  { title: "Tinjauan trust", desc: "Perubahan skor yang perlu diperiksa.", num: 0 },
];

export default async function ModeratorPage() {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  return (
    <AppShell user={session.user}>
      <h1 className="page-title">Panel Moderasi</h1>
      <p className="page-sub">Tinjau laporan dan konten yang membutuhkan perhatian.</p>

      <div className="notice">Tampilan sementara. Data akan terhubung setelah modul laporan dan forum jadi.</div>

      <div className="grid">
        {sections.map((s) => (
          <div className="card stat" key={s.title}>
            <div className="num">{s.num}</div>
            <div className="label">{s.title}</div>
            <p style={{ marginTop: 8 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
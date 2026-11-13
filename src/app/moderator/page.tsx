import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { countUnverifiedReports } from "@/modules/report/queries";
import { requireRole } from "../../lib/auth/guards";


export default async function ModeratorPage() {
  const session = await requireRole(["MODERATOR", "ADMIN"]);
  const unverified = await countUnverifiedReports();

  const sections: { title: string; desc: string; num: number; href?: string }[] = [
    { title: "Laporan masuk", desc: "Laporan yang menunggu ditinjau.", num: unverified, href: "/moderator/laporan" },
    { title: "Konten ditandai", desc: "Postingan forum yang dilaporkan.", num: 0 },
    { title: "Tinjauan trust", desc: "Perubahan skor yang perlu diperiksa.", num: 0 },
  ];

  return (
    <AppShell user={session.user}>
      <h1 className="page-title">Panel Moderasi</h1>
      <p className="page-sub">Tinjau laporan dan konten yang membutuhkan perhatian.</p>

      <div className="notice">Hanya kartu Laporan masuk yang sudah terhubung data. Konten ditandai dan Tinjauan trust menyusul setelah modul forum dan trust jadi.</div>

      <div className="grid">
        {sections.map((s) => (
          <div className="card stat" key={s.title}>
            <div className="num">{s.num}</div>
            <div className="label">{s.href ? <Link href={s.href}>{s.title}</Link> : s.title}</div>
            <p style={{ marginTop: 8 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
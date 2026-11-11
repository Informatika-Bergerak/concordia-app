import { MessageCircleMore, Plus, Search } from "lucide-react";
import styles from "./grup.module.css";

const groups = [
  ["Informatika Bergerak", "Adrian H: Hidup Mahasiswa", "IB"],
  ["Jual Beli Barang Hilang", "Suaramu Paling HeBo! IPHONE 16 PRO MAX 1TB DEN...", "JB"],
  ["GRUP KITA", "Iksan DWP: Sini warkop gaes", "GK"],
  ["futsal", "Silakan Hadir! List futsal...", "F"],
  ["ML", "Erlangga Y P: 1 exp", "ML"],
  ["MBAA IF", "Gilang: Kebal Hukim", "MI"],
  ["Pemuda Tangguh", "Ustad: PENGAJIAN SESUDAH SHOLAT SUBUH DI MA...", "PT"],
  ["KOS SEMINAR", "Erlangga Arca: Dimulai jam 8 Pagi", "KS"],
  ["EVENT IIIK", "Aji: ayo guys event di mall (swak)", "EI"],
  ["Freelance", "Yudi: let's good team lah!!", "FR"],
  ["YKP HEBAT", "Bara: Ayoo kumpulan kumpul besok!!", "YH"],
  ["Pembelajaran Informatika", "Luk: Hadir", "PI"],
  ["Kuliah Umum", "Fina: P3K INFO 10 2026", "KU"],
];

export default function GrupPage() {
  return (
    <section className={styles.group} aria-label="Daftar grup chat">
      <h1>Chat Group</h1>
      <label className={styles.search}>
        <Search size={14} aria-hidden="true" />
        <input type="search" placeholder="Cari Grup atau Obrolan" aria-label="Cari grup atau obrolan" />
        <MessageCircleMore size={15} aria-hidden="true" />
      </label>
      <div className={styles.list}>
        {groups.map(([name, preview, initials]) => (
          <button key={name} className={styles.row} type="button">
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <span className={styles.copy}><strong>{name}</strong><span>{preview}</span></span>
            <span className={styles.meta}><time>15.00</time><b>1</b></span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.fab} aria-label="Buat grup baru"><Plus size={25} /></button>
    </section>
  );
}

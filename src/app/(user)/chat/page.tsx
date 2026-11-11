import { Search, Users, MessageCircleMore, Plus } from "lucide-react";
import styles from "./chat.module.css";

const groups = [
  { name: "Informatika Bergerak", members: "Admin Hasima", color: "#a2070a" },
  { name: "Jual Beli Barang Hilang", members: "Suaramu Paling HeBo", color: "#a2070a" },
  { name: "Futsal", members: "Silakan hadir! List futsal...", color: "#a2070a" },
];

const chats = [
  ["Informatika Bergerak", "Admin Hasima", "IB"],
  ["Jual Beli Barang Hilang", "Suaramu Paling HeBo", "JB"],
  ["GRUP KITA", "Iksan DWP: Sini warkop gaes", "GK"],
  ["Futsal", "Silakan hadir! List futsal...", "F"],
  ["ML", "Erlangga Y P: i exp", "ML"],
];

const people = [
  ["Adrian", "REPO WRY REPO"],
  ["Erlangga Y P", "piye kabar?"],
  ["Suzan", "belum deh"],
  ["Ikhsan", "mana dokumentasi nya!!!!"],
  ["Rummy", "Hidup MMI!!"],
];

function ChatRow({ name, preview, initials }: { name: string; preview: string; initials?: string }) {
  return (
    <button className={styles.chatRow} type="button">
      <span className={styles.avatar} aria-hidden="true">{initials ?? name.slice(0, 1)}</span>
      <span className={styles.chatCopy}>
        <strong>{name}</strong>
        <span>{preview}</span>
      </span>
      <span className={styles.meta}><time>15.00</time><b>1</b></span>
    </button>
  );
}

export default function Page() {
  return (
    <section className={styles.chat} aria-label="Daftar chat">
      <label className={styles.search}>
        <Search size={15} aria-hidden="true" />
        <input type="search" placeholder="Cari Grup atau Obrolan" aria-label="Cari grup atau obrolan" />
        <MessageCircleMore size={16} aria-hidden="true" />
      </label>

      <div className={styles.groupGrid}>
        {groups.map((group) => (
          <button key={group.name} className={styles.groupCard} style={{ backgroundColor: group.color }} type="button">
            <span>{group.name}</span>
            <Users size={18} />
          </button>
        ))}
      </div>

      <div className={styles.sectionTitle}>Grup <span>›</span></div>
      <div className={styles.list}>{chats.map(([name, preview, initials]) => <ChatRow key={name} name={name} preview={preview} initials={initials} />)}</div>

      <div className={styles.sectionTitle}>Personal <span>›</span></div>
      <div className={styles.list}>{people.map(([name, preview]) => <ChatRow key={name} name={name} preview={preview} />)}</div>

      <button type="button" className={styles.fab} aria-label="Mulai chat baru"><Plus size={26} /></button>
    </section>
  );
}

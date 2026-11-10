import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import styles from "./right-sidebar.module.css";

type Person = {
  id: number;
  name: string;
  fotoProfil: string | null;
};

export function RightSidebar({ people }: { people: Person[] }) {
  return (
    <aside className={styles.sidebar} aria-label="Informasi komunitas">
      <section className={styles.section} aria-labelledby="friends-heading">
        <div className={styles.heading}>
          <h2 id="friends-heading">Friends</h2>
          <Link href="/teman">Lihat semua</Link>
        </div>
        {people.length ? (
          <ul className={styles.list}>
            {people.map((person) => (
              <li key={person.id}>
                <Link href="/teman" className={styles.person}>
                  <Avatar name={person.name} size={36} />
                  <span>{person.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Belum ada anggota lain untuk ditampilkan.</p>
        )}
        <p className={styles.note}>Menampilkan anggota ConCordia yang tersedia.</p>
      </section>

      <section className={styles.section} aria-labelledby="groups-heading">
        <div className={styles.heading}>
          <h2 id="groups-heading">Groups</h2>
          <Link href="/grup">Lihat semua</Link>
        </div>
        <p className={styles.empty}>
          <UsersRound size={18} aria-hidden="true" /> Belum ada grup yang tersedia.
        </p>
      </section>
    </aside>
  );
}

import { Avatar } from "@/components/ui/avatar";
import { FriendRequestButton } from "@/components/friends/friend-request-button";
import type { FriendRelation } from "@/modules/friends/types";
import styles from "./right-sidebar.module.css";

type Person = {
  id: number;
  name: string;
  fotoProfil: string | null;
  relation: FriendRelation;
};

export function RightSidebar({ people }: { people: Person[] }) {
  return (
    <aside className={styles.sidebar} aria-label="Saran teman">
      <section className={styles.section} aria-labelledby="suggested-heading">
        <div className={styles.heading}>
          <h2 id="suggested-heading">Disarankan</h2>
        </div>
        {people.length ? (
          <ul className={styles.list}>
            {people.map((person) => (
              <li key={person.id} className={styles.personRow}>
                <div className={styles.person}>
                  <Avatar name={person.name} size={36} />
                  <span>{person.name}</span>
                </div>
                <FriendRequestButton userId={person.id} initialRelation={person.relation} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Belum ada saran teman saat ini.</p>
        )}
      </section>
    </aside>
  );
}

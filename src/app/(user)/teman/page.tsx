import { UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { FriendResponseButtons } from "@/components/friends/friend-response-buttons";
import { getFriendLists } from "@/modules/friends/queries";
import styles from "./teman.module.css";
import friendStyles from "@/components/friends/friends.module.css";

function PersonRow({ children, person }: { children?: React.ReactNode; person: { name: string; username: string; fotoProfil: string | null; jurusan: string | null; role: "USER" | "MODERATOR" | "ADMIN"; userType: "MAHASISWA" | "DOSEN" | null } }) {
  return (
    <article className={friendStyles.person}>
      {person.fotoProfil ? (
        // URL berasal dari metadata foto yang sudah divalidasi server.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={friendStyles.avatar} src={person.fotoProfil} alt={`Foto profil ${person.name}`} />
      ) : <Avatar name={person.name} size={46} />}
      <div className={friendStyles.copy}>
        <strong>{person.name}</strong>
        <span>@{person.username} · {person.jurusan ?? "ConCordia"}</span>
        <RoleBadge role={person.role} userType={person.userType} />
      </div>
      {children}
    </article>
  );
}

export default async function TemanPage() {
  const { friends, incoming, outgoing } = await getFriendLists();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Teman</h1>
        <UsersRound size={22} aria-hidden="true" />
      </header>

      <section className={styles.section} aria-labelledby="incoming-heading">
        <div className={styles.sectionHeading}><h2 id="incoming-heading">Permintaan masuk</h2><span className={styles.count}>{incoming.length}</span></div>
        {incoming.length > 0 ? incoming.map((request) => (
          <PersonRow key={request.requestId} person={request}><FriendResponseButtons requestId={request.requestId} /></PersonRow>
        )) : <p className={styles.empty}>Belum ada permintaan pertemanan.</p>}
      </section>

      <section className={styles.section} aria-labelledby="friends-heading">
        <div className={styles.sectionHeading}><h2 id="friends-heading">Teman kamu</h2><span className={styles.count}>{friends.length}</span></div>
        {friends.length > 0 ? friends.map((person) => <PersonRow key={person.id} person={person} />) : <p className={styles.empty}>Kamu belum memiliki teman.</p>}
      </section>

      <section className={styles.section} aria-labelledby="outgoing-heading">
        <div className={styles.sectionHeading}><h2 id="outgoing-heading">Permintaan terkirim</h2><span className={styles.count}>{outgoing.length}</span></div>
        {outgoing.length > 0 ? outgoing.map((request) => <PersonRow key={request.requestId} person={request}><span className={friendStyles.resultText}>Requested</span></PersonRow>) : <p className={styles.empty}>Belum ada permintaan terkirim.</p>}
      </section>
    </div>
  );
}

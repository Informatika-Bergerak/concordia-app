"use client";
import { useEffect, useState, useTransition } from "react";  // load live public groups on open
//
// The discovery modal receives an empty initial list because it is client-opened;
// fetch the authenticated directory immediately rather than waiting for typing.
import { Users, Search } from "lucide-react";
import { joinPublicGroupAction } from "@/modules/group/actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./group.module.css";
type Group = { id: number; name: string; description: string | null; photo: string | null; creator: { name: string }; memberCount: number; isMember: boolean; requestStatus?: "PENDING" | "REJECTED" | null };
export function GroupDiscovery({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => { void searchGroups(""); }, []);
  async function searchGroups(value: string) {
    const response = await fetch(`/api/groups/discover?q=${encodeURIComponent(value)}`);
    if (response.ok) setGroups((await response.json()).groups);
  }
  const search = async (value: string) => {
    setQuery(value);
    const response = await fetch(`/api/groups/discover?q=${encodeURIComponent(value)}`);
    if (response.ok) setGroups((await response.json()).groups);
  };
  const join = (id: number) => startTransition(async () => {
    const result = await joinPublicGroupAction({ groupId: id });
    if (result.ok) {
      setGroups((items) => items.map((item) => item.id === id ? { ...item, requestStatus: "PENDING" } : item));
      router.refresh();
    }
  });
  return <section className={styles.discovery}>
    <h2>Temukan Grup</h2>
    <p>Jelajahi berbagai grup publik di Concordia dan bergabung dengan komunitas yang sesuai dengan minatmu.</p>
    <div className={styles.search}><Search size={16} /><input placeholder="Cari nama grup atau komunitas..." value={query} onChange={(e) => search(e.target.value)} /></div>
    {groups.length === 0 ? <p className={styles.emptyText}>Grup publik tidak ditemukan.</p> : <div className={styles.discoveryGrid}>{groups.map((group) => <article className={styles.discoveryCard} key={group.id}><div className={styles.cardAvatar}>{group.photo ? <Image src={group.photo} alt={group.name} width={46} height={46} unoptimized /> : <Users size={22} />}</div><h3>{group.name}</h3><p>{group.description || "Belum ada deskripsi grup."}</p><small>Dibuat oleh {group.creator.name} · {group.memberCount} anggota</small><button disabled={pending || group.isMember || group.requestStatus === "PENDING"} onClick={() => join(group.id)}>{group.isMember ? "Sudah Bergabung" : group.requestStatus === "PENDING" ? "Menunggu Persetujuan" : "Ikuti Grup"}</button></article>)}</div>}
  </section>;
}

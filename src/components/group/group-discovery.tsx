"use client";

import { useEffect, useState, useTransition } from "react";
import { Flag, Search, Users } from "lucide-react";
import { cancelGroupJoinRequestAction, joinPublicGroupAction } from "@/modules/group/actions";
import { GroupConfirmationModal } from "./confirmation-modal";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./group.module.css";

type Group = {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  creator: { name: string };
  memberCount: number;
  isMember: boolean;
  requestStatus?: "PENDING" | "REJECTED" | null;
};

export function GroupDiscovery({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Group | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    void searchGroups("");
  }, []);

  async function searchGroups(value: string) {
    const response = await fetch(`/api/groups/discover?q=${encodeURIComponent(value)}`);
    if (response.ok) setGroups((await response.json()).groups);
  }

  const search = async (value: string) => {
    setQuery(value);
    await searchGroups(value);
  };

  const join = (id: number) => startTransition(async () => {
    const result = await joinPublicGroupAction({ groupId: id });
    if (result.ok) {
      setGroups((items) => items.map((item) => item.id === id ? { ...item, requestStatus: "PENDING" } : item));
      router.refresh();
    }
  });

  const cancelRequest = (id: number) => startTransition(async () => {
    setError(null);
    const result = await cancelGroupJoinRequestAction({ groupId: id });
    if (result.ok) {
      setGroups((items) => items.map((item) => item.id === id ? { ...item, requestStatus: null } : item));
      setCancelTarget(null);
      setNotice("Pengajuan masuk grup berhasil dibatalkan.");
      router.refresh();
    } else {
      setError(result.error);
    }
  });

  const cancelTargetModal = cancelTarget ? (
    <GroupConfirmationModal
      title="Batalkan Pengajuan Masuk Grup?"
      message="Apakah Anda yakin ingin membatalkan pengajuan untuk bergabung dengan grup ini?"
      cancelLabel="Kembali"
      confirmLabel="Ya, Batalkan"
      pending={pending}
      onCancel={() => setCancelTarget(null)}
      onConfirm={() => cancelRequest(cancelTarget.id)}
    />
  ) : null;

  return <>
    <section className={styles.discovery}>
      <h2>Temukan Grup</h2>
      <p>Jelajahi berbagai grup publik di Concordia dan bergabung dengan komunitas yang sesuai dengan minatmu.</p>
      <div className={styles.search}>
        <Search size={16} />
        <input placeholder="Cari nama grup atau komunitas..." value={query} onChange={(e) => search(e.target.value)} />
      </div>
      {error && <p className={styles.groupError} role="alert">{error}</p>}
      {notice && <p className={styles.groupNotice} role="status">{notice}</p>}
      {groups.length === 0 ? (
        <p className={styles.emptyText}>Grup publik tidak ditemukan.</p>
      ) : (
        <div className={styles.discoveryGrid}>
          {groups.map((group) => (
            <article className={styles.discoveryCard} key={group.id}>
              <div className={styles.cardAvatar}>
                {group.photo ? <Image src={group.photo} alt={group.name} width={46} height={46} unoptimized /> : <Users size={22} />}
              </div>
              <h3>{group.name}</h3>
              <p>{group.description || "Belum ada deskripsi grup."}</p>
              <small>Dibuat oleh {group.creator.name} · {group.memberCount} anggota</small>
              {group.isMember ? (
                <button disabled>Sudah Bergabung</button>
              ) : group.requestStatus === "PENDING" ? (
                <div className={styles.pendingJoin}>
                  <span>Menunggu Persetujuan</span>
                  <button type="button" disabled={pending} onClick={() => setCancelTarget(group)}>
                    Batalkan Pengajuan
                  </button>
                </div>
              ) : (
                <button disabled={pending} onClick={() => join(group.id)}>Ikuti Grup</button>
              )}
              <a className={styles.reportCardBtn} href={`/laporan/baru?groupId=${group.id}`}>
                <Flag size={14} /> Laporkan Grup
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
    {cancelTargetModal}
  </>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { AVAILABILITY_LABELS } from "@/modules/marketplace/constants";
import { formatDate, formatRupiah } from "@/modules/marketplace/format";
import type {
  ConversationSummary,
  InsightPeriod,
  InsightStats,
  ListingComment,
  SellerListing,
} from "@/modules/marketplace/seller-types";
import { ConfirmDialog } from "./confirm-dialog";
import { ListingPhoto } from "./listing-photo";
import { InsightPanel } from "./seller-stats";
import base from "./marketplace.module.css";
import styles from "./seller.module.css";

type Tab = "comments" | "messages" | "insight";

type Props = {
  listing: SellerListing;
  comments: ListingComment[];
  conversations: ConversationSummary[];
  insight: Record<InsightPeriod, InsightStats>;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "comments", label: "Komentar" },
  { id: "messages", label: "Pesan" },
  { id: "insight", label: "Insight" },
];

export function SellerListingView({ listing, comments, conversations, insight }: Props) {
  const [tab, setTab] = useState<Tab>("comments");
  const [active, setActive] = useState(listing.active);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Record<number, string[]>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function shareListing() {
    setMenuOpen(false);
    const url = `${window.location.origin}/marketplace/${listing.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice("Tautan tawaran disalin.");
    } catch {
      // Dibatalkan oleh pengguna.
    }
  }

  async function copyListing() {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/marketplace/${listing.slug}`);
      setNotice("Tautan tawaran disalin.");
    } catch {
      setNotice("Tidak dapat menyalin tautan.");
    }
  }

  function toggleActive() {
    // TODO: panggil server action aktif/non-aktifkan tawaran saat backend selesai.
    setActive((value) => !value);
  }

  function confirmDelete() {
    setConfirmOpen(false);
    // TODO: panggil server action hapus tawaran saat backend selesai.
    setNotice("Tampilan demo: penghapusan aktif setelah backend Marketplace terhubung.");
  }

  function submitReply(id: number) {
    const text = replyText.trim();
    if (text === "") return;
    // TODO: simpan balasan lewat server action saat backend selesai.
    setReplies((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), text] }));
    setReplyText("");
    setReplyTo(null);
  }

  return (
    <div className={`${base.page} ${styles.sellerPage}`}>
      <section className={styles.sellerCard} aria-labelledby="seller-card-title">
        <div className={styles.cardHead}>
          <h1 id="seller-card-title">Penawaran Anda</h1>
          <Link href="/marketplace/jual" className={styles.closeLink} aria-label="Tutup">
            <X size={22} aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.summary}>
          <ListingPhoto src={listing.photoUrl} alt={`Foto ${listing.title}`} className={styles.summaryThumb} />
          <div className={styles.summaryBody}>
            <p className={styles.summaryTitle}>{listing.title}</p>
            <p className={styles.summaryPrice}>{formatRupiah(listing.price)}</p>
            <p className={styles.summaryMeta}>Ditawarkan Tanggal {formatDate(listing.postedAt)}</p>
            <p className={styles.summaryMeta}>{AVAILABILITY_LABELS[listing.availability]}</p>
            <div className={styles.statusRow}>
              <button type="button" className={active ? styles.dangerTag : styles.activateTag} onClick={toggleActive} aria-pressed={!active}>
                {active ? "Non - Aktifkan Produk" : "Aktifkan Produk"}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.actionRow} ref={menuRef}>
          <Link href={`/marketplace/${listing.slug}/edit`} className={styles.actionBtn}>
            <Pencil size={16} aria-hidden="true" /> Edit Tawaran
          </Link>
          <button type="button" className={styles.actionBtn} onClick={() => setConfirmOpen(true)}>
            <Trash2 size={16} aria-hidden="true" /> Hapus Tawaran
          </button>
          <button type="button" className={styles.actionBtn} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <MoreHorizontal size={16} aria-hidden="true" /> Lainnya
          </button>
          {menuOpen && (
            <div className={styles.menuPop} role="menu">
              <Link href={`/marketplace/${listing.slug}`} role="menuitem" onClick={() => setMenuOpen(false)}>Lihat Tawaran</Link>
              <button type="button" role="menuitem" onClick={shareListing}>Bagikan Tawaran</button>
              <button type="button" role="menuitem" onClick={copyListing}>Salin Tawaran</button>
            </div>
          )}
        </div>

        {notice && <p className={base.note} role="status">{notice}</p>}

        <div className={styles.tabBar} role="tablist" aria-label="Detail tawaran">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`own-tab-${id}`}
              aria-selected={tab === id}
              aria-controls="own-panel"
              className={`${styles.tabBtn} ${tab === id ? styles.tabBtnActive : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.tabPanel} role="tabpanel" id="own-panel" aria-labelledby={`own-tab-${tab}`}>
          {tab === "comments" && (
            comments.length === 0 ? (
              <p className={base.empty}>Belum ada komentar.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <span className={styles.avatarLg} aria-hidden="true">{comment.author.charAt(0)}</span>
                  <div className={styles.commentBody}>
                    <p><span className={styles.commentName}>{comment.author}</span> <span className={styles.commentAgo}>{comment.ago}</span></p>
                    <p>{comment.text}</p>
                    {(replies[comment.id] ?? []).map((text, index) => (
                      <p key={index} className={styles.replyText}><strong>Anda</strong> {text}</p>
                    ))}
                    {replyTo === comment.id ? (
                      <div className={styles.replyBox}>
                        <input className={base.input} value={replyText} onChange={(event) => setReplyText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitReply(comment.id); }} placeholder="Tulis balasan" aria-label={`Balas ${comment.author}`} autoFocus />
                        <button type="button" className={base.smallPrimaryBtn} onClick={() => submitReply(comment.id)}>Kirim</button>
                      </div>
                    ) : (
                      <button type="button" className={styles.replyBtn} onClick={() => { setReplyTo(comment.id); setReplyText(""); }}>Balas</button>
                    )}
                  </div>
                </div>
              ))
            )
          )}

          {tab === "messages" && (
            conversations.length === 0 ? (
              <p className={base.empty}>Belum ada pesan.</p>
            ) : (
              conversations.map((conversation) => (
                <Link key={conversation.id} href={`/marketplace/pesan/${conversation.id}`} className={styles.convItem}>
                  <span className={styles.avatarLg} aria-hidden="true">{conversation.name.charAt(0)}</span>
                  <div className={styles.convBody}>
                    <p className={styles.convName}>{conversation.name}</p>
                    <p>{conversation.lastMessage}</p>
                  </div>
                  <div className={styles.convEnd}>
                    <span>{conversation.time}</span>
                    {conversation.unread > 0 && <span className={styles.unreadBadge} aria-label={`${conversation.unread} belum dibaca`}>{conversation.unread}</span>}
                  </div>
                </Link>
              ))
            )
          )}

          {tab === "insight" && <InsightPanel data={insight} detailed />}
        </div>
      </section>

      {confirmOpen && (
        <ConfirmDialog
          title="Hapus Tawaran Anda ?"
          description="Anda yakin ingin menghapus tawaran ini ?"
          confirmLabel="Hapus"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

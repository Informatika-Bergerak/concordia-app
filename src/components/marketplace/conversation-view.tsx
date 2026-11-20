"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MoreVertical, Plus, Search, Send, Smile } from "lucide-react";
import { AVAILABILITY_LABELS } from "@/modules/marketplace/constants";
import { formatDate, formatRupiah } from "@/modules/marketplace/format";
import type { ChatMessage, ConversationDetail } from "@/modules/marketplace/seller-types";
import type { ListingSummary } from "@/modules/marketplace/types";
import { ListingPhoto } from "./listing-photo";
import base from "./marketplace.module.css";
import styles from "./seller.module.css";

type Props = {
  conversation: ConversationDetail;
  listing: ListingSummary | null;
  backHref: string;
};

function nowLabel() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
}

export function ConversationView({ conversation, listing, backHref }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const text = draft.trim();
    if (text === "") return;
    // TODO: kirim lewat server action / modul chat saat backend selesai.
    setMessages((prev) => [...prev, { id: prev.length + 1, sender: "me", name: "Anda", time: nowLabel(), kind: "text", text }]);
    setDraft("");
  }

  return (
    <div className={base.page}>
      <div className={styles.chatShell}>
        <header className={styles.chatTop}>
          <Link href={backHref} className={base.backBtn} aria-label="Kembali">
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
          <span className={styles.avatarLg} aria-hidden="true">{conversation.partnerName.charAt(0)}</span>
          <h1 className={styles.chatTitle}>{conversation.partnerName}</h1>
          <button type="button" className={base.iconBtn} aria-label="Cari di percakapan" disabled>
            <Search size={16} aria-hidden="true" />
          </button>
          <button type="button" className={styles.composerBtn} aria-label="Menu lainnya" disabled>
            <MoreVertical size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.chatBody} role="log" aria-live="polite" aria-label="Percakapan">
          <div className={styles.dateDivider}>{conversation.dateLabel}</div>
          {messages.map((message) => (
            <div key={message.id} className={styles.msgRow}>
              <span className={styles.avatarLg} aria-hidden="true">{message.name.charAt(0)}</span>
              <div className={styles.msgMain}>
                <div className={styles.msgMeta}>
                  <span className={styles.msgName}>{message.name}</span>
                  <span className={styles.msgTime}>{message.time}</span>
                </div>
                {message.kind === "text" && <p className={styles.msgText}>{message.text}</p>}
                {message.kind === "offer" && message.offerAmount !== undefined && (
                  <p className={styles.offerBubble}>
                    <strong>{formatRupiah(message.offerAmount)}</strong> {message.text}
                  </p>
                )}
                {(message.kind === "listing" || message.kind === "offer") && listing && (
                  <Link href={`/marketplace/${listing.slug}`} className={styles.embedCard}>
                    <ListingPhoto src={listing.photoUrl} alt={`Foto ${listing.title}`} className={base.historyThumb} />
                    <div className={base.historyBody}>
                      <p className={base.historyTitle}>{listing.title}</p>
                      <p className={base.historyPrice}>{formatRupiah(listing.price)}</p>
                      <p className={base.historyMeta}>{listing.location}</p>
                      <p className={base.historyMeta}>{AVAILABILITY_LABELS[listing.availability]}</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <p className={styles.demoNote}>Tampilan demo: pesan belum terhubung ke backend atau modul chat.</p>

        <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); send(); }}>
          <button type="button" className={styles.composerBtn} aria-label="Lampirkan" disabled>
            <Plus size={20} aria-hidden="true" />
          </button>
          <input className={styles.composerInput} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ketik Pesan" aria-label="Ketik pesan" />
          <button type="button" className={styles.composerBtn} aria-label="Emoji" disabled>
            <Smile size={20} aria-hidden="true" />
          </button>
          <button type="button" className={styles.composerBtn} aria-label="Pesan suara" disabled>
            <Mic size={20} aria-hidden="true" />
          </button>
          <button type="submit" className={styles.composerBtn} aria-label="Kirim pesan">
            <Send size={20} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

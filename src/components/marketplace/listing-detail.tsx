"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, MessageCircle, Share2, Tag } from "lucide-react";
import { AVAILABILITY_LABELS } from "@/modules/marketplace/constants";
import { formatRupiah } from "@/modules/marketplace/format";
import type { ListingDetail } from "@/modules/marketplace/types";
import { ListingPhoto } from "./listing-photo";
import { OfferSheet } from "./offer-sheet";
import styles from "./marketplace.module.css";

type Comment = { id: number; text: string };

const COLLAPSED_ROWS = 2;

export function ListingDetailView({ listing, isOwner = false }: { listing: ListingDetail; isOwner?: boolean }) {
  const [offerOpen, setOfferOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sellerAdded, setSellerAdded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const hasMore = listing.specs.length > COLLAPSED_ROWS || listing.details.length > COLLAPSED_ROWS;
  const specs = expanded ? listing.specs : listing.specs.slice(0, COLLAPSED_ROWS);
  const details = expanded ? listing.details : listing.details.slice(0, COLLAPSED_ROWS);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice("Tautan disalin.");
    } catch {
      // Pengguna membatalkan berbagi; tidak perlu pesan.
    }
  }

  function submitComment() {
    const text = commentText.trim();
    if (text === "") return;
    // TODO: simpan komentar lewat server action saat backend tersedia.
    setComments((prev) => [...prev, { id: prev.length + 1, text }]);
    setCommentText("");
  }

  return (
    <div className={styles.page}>
      <Link href="/marketplace" className={styles.backLink}>
        <ArrowLeft size={20} aria-hidden="true" /> Marketplace
      </Link>

      <div className={styles.detail}>
        <div className={styles.detailMedia}>
          <ListingPhoto src={listing.photoUrl} alt={`Foto ${listing.title}`} className={styles.detailPhoto} priority />
        </div>

        <div className={styles.detailInfo}>
          <div>
            <h1 className={styles.detailTitle}>{listing.title}</h1>
            <p className={styles.detailPrice}>{formatRupiah(listing.price)}</p>
            <p className={styles.detailMeta}>{listing.location} · {AVAILABILITY_LABELS[listing.availability]}</p>
          </div>

          <section className={styles.block} aria-labelledby="deskripsi">
            <h2 id="deskripsi">Deskripsi</h2>
            <p>{listing.description}</p>
          </section>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={() => setNotice("Fitur pesan belum tersedia.")}>
              <MessageCircle size={18} aria-hidden="true" /> Kirim Pesan
            </button>
            <button type="button" className={styles.squareBtn} onClick={() => setOfferOpen(true)} aria-label="Tawar harga" disabled={listing.availability === "SOLD"}>
              <Tag size={20} aria-hidden="true" />
            </button>
            <button type="button" className={styles.squareBtn} onClick={handleShare} aria-label="Bagikan">
              <Share2 size={20} aria-hidden="true" />
            </button>
            <button type="button" className={styles.squareBtn} onClick={() => setSaved((value) => !value)} aria-label={saved ? "Hapus dari tersimpan" : "Simpan"} aria-pressed={saved}>
              <Bookmark size={20} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          {notice && <p className={styles.note} role="status">{notice}</p>}
          {isOwner && (
            <Link href={`/marketplace/${listing.slug}/edit`} className={styles.linkBtn}>Edit tawaran</Link>
          )}

          <section className={styles.block} aria-labelledby="diskusi">
            <h2 id="diskusi">Komentar dan Diskusi</h2>
            <div className={styles.commentRow}>
              <input className={styles.input} placeholder="Apa ini masih ada?" value={commentText} onChange={(event) => setCommentText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitComment(); }} aria-label="Tulis komentar" />
              <button type="button" className={styles.smallPrimaryBtn} onClick={submitComment}>Kirim</button>
            </div>
            {comments.length > 0 && (
              <ul className={styles.commentList}>
                {comments.map((comment) => (
                  <li key={comment.id}><strong>Anda</strong> {comment.text}</li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.block} aria-labelledby="penjual">
            <h2 id="penjual">Penjual</h2>
            <div className={styles.sellerRow}>
              <span className={styles.avatar} aria-hidden="true">{listing.seller.name.charAt(0)}</span>
              <div className={styles.sellerText}>
                <p className={styles.sellerName}>{listing.seller.name}</p>
                <p className={styles.sellerMajor}>{listing.seller.major}</p>
              </div>
              <button type="button" className={styles.smallSoftBtn} onClick={() => setSellerAdded((value) => !value)} aria-pressed={sellerAdded}>
                {sellerAdded ? "Ditambahkan" : "Tambahkan"}
              </button>
            </div>

            <h3>Spesifikasi</h3>
            <dl className={styles.specList}>
              {specs.map((item) => (
                <div key={item.label} className={styles.specRow}><dt>{item.label}</dt><dd>{item.value}</dd></div>
              ))}
            </dl>
            <h3>Detail</h3>
            <dl className={styles.specList}>
              {details.map((item) => (
                <div key={item.label} className={styles.specRow}><dt>{item.label}</dt><dd>{item.value}</dd></div>
              ))}
            </dl>
            {hasMore && (
              <button type="button" className={styles.linkBtn} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
                {expanded ? "Lihat Lebih Sedikit" : "Lihat Selengkapnya"}
              </button>
            )}
          </section>
        </div>
      </div>

      {offerOpen && (
        <OfferSheet
          target={{ title: listing.title, price: listing.price, location: listing.location, photoUrl: listing.photoUrl }}
          onClose={() => setOfferOpen(false)}
        />
      )}
    </div>
  );
}

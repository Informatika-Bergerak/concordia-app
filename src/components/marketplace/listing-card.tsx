import Link from "next/link";
import { AVAILABILITY_LABELS } from "@/modules/marketplace/constants";
import { formatRupiah } from "@/modules/marketplace/format";
import type { ListingSummary } from "@/modules/marketplace/types";
import { ListingPhoto } from "./listing-photo";
import styles from "./marketplace.module.css";

export function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <Link href={`/marketplace/${listing.slug}`} className={styles.card}>
      <div className={styles.cardMedia}>
        <ListingPhoto src={listing.photoUrl} alt={`Foto ${listing.title}`} className={styles.cardPhoto} />
        {listing.availability === "SOLD" && <span className={styles.badge}>{AVAILABILITY_LABELS.SOLD}</span>}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardPrice}>{formatRupiah(listing.price)}</p>
        <p className={styles.cardTitle}>{listing.title}</p>
        <p className={styles.cardLocation}>{listing.location}</p>
      </div>
    </Link>
  );
}

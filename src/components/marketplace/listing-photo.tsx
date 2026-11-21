import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import styles from "./marketplace.module.css";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

/**
 * Foto penawaran. Tanpa foto, tampil placeholder.
 * `unoptimized` dipakai agar URL Cloudinary tidak butuh konfigurasi images.remotePatterns.
 */
export function ListingPhoto({ src, alt, className, priority }: Props) {
  const wrapper = `${styles.photo} ${className ?? ""}`;

  if (!src) {
    return (
      <div className={wrapper} role="img" aria-label={alt}>
        <span className={styles.photoFallback}>
          <ImageIcon size={32} aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <Image src={src} alt={alt} fill sizes="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 25vw" unoptimized priority={priority} className={styles.photoImg} />
    </div>
  );
}

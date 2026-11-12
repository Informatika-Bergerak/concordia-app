export type ReportStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export type ReportCategory =
  | "FASILITAS"
  | "KEBERSIHAN"
  | "KEAMANAN"
  | "KEHILANGAN"
  | "KEBIJAKAN"
  | "LAINNYA";

/**
 * PUBLIC    : terlihat semua pengguna, identitas pelapor ditampilkan
 * ANONYMOUS : terlihat semua pengguna, identitas pelapor disembunyikan
 * PRIVATE   : hanya terlihat oleh pelapor dan petugas
 */
export type ReportVisibility = "PUBLIC" | "ANONYMOUS" | "PRIVATE";

export type ReportItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: ReportCategory;
  status: ReportStatus;
  visibility: ReportVisibility;
  /** ISO date (yyyy-mm-dd) kejadian terjadi atau terlihat */
  occurredAt: string;
  coverImage: string | null;
  /** Nama pelapor. Tidak ditampilkan bila visibility = ANONYMOUS */
  authorName: string | null;
  /** true bila laporan dibuat oleh pengguna yang sedang login */
  isMine: boolean;
  supportCount: number;
};

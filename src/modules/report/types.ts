export type ReportStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export type ReportCategory =
  | "FASILITAS"
  | "KEBERSIHAN"
  | "KEAMANAN"
  | "KEHILANGAN"
  | "KEBIJAKAN"
  | "LAINNYA";

export type ReportVisibility = "PUBLIC" | "PRIVATE";

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
  /** Nama pelapor; null berarti ditampilkan sebagai Anonymous */
  authorName: string | null;
  /** true bila laporan dibuat oleh pengguna yang sedang login */
  isMine: boolean;
  supportCount: number;
};

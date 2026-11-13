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

export type ReportHistoryEntry = {
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  note: string | null;
  /** ISO datetime */
  createdAt: string;
};

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

export type ReportDetail = ReportItem & {
  photos: string[];
  /** Alasan penolakan; hanya diisi untuk pelapor dan admin */
  rejectionReason: string | null;
  /** Riwayat status; hanya diisi untuk pelapor dan admin */
  history: ReportHistoryEntry[];
};

/**
 * Tampilan untuk petugas (moderator dan admin). Identitas pelapor laporan Anonymous
 * hanya terlihat oleh admin; bagi moderator nama dan username bernilai null.
 */
export type StaffReportItem = ReportItem & {
  authorName: string | null;
  authorUsername: string | null;
  createdAt: string;
  rejectionReason: string | null;
};

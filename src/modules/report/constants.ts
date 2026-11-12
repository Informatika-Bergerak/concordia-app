import type { ReportCategory, ReportStatus } from "./types";

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  FASILITAS: "Fasilitas Kampus",
  KEBERSIHAN: "Kebersihan",
  KEAMANAN: "Keamanan",
  KEHILANGAN: "Kehilangan Barang",
  KEBIJAKAN: "Melanggar Kebijakan",
  LAINNYA: "Lainnya",
};

// Label mengikuti desain Figma. Samakan dengan Adrian bila istilah status berubah.
export const STATUS_LABELS: Record<ReportStatus, string> = {
  UNVERIFIED: "Belum Terverifikasi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Gagal Terverifikasi",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [
  ReportCategory,
  string,
][];

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [ReportStatus, string][];

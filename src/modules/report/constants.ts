import type { ReportCategory, ReportStatus, ReportVisibility } from "./types";

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

export const VISIBILITY_LABELS: Record<ReportVisibility, string> = {
  PUBLIC: "Public",
  ANONYMOUS: "Anonymous",
  PRIVATE: "Private",
};

export const VISIBILITY_HINTS: Record<ReportVisibility, string> = {
  PUBLIC: "Laporan dan nama kamu terlihat oleh pengguna lain.",
  ANONYMOUS: "Laporan terlihat oleh pengguna lain, tetapi nama kamu disembunyikan.",
  PRIVATE: "Hanya kamu dan petugas kampus yang dapat melihat laporan ini.",
};

export const VISIBILITY_OPTIONS = Object.entries(VISIBILITY_LABELS) as [
  ReportVisibility,
  string,
][];

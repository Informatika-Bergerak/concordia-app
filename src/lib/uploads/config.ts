export type UploadKind = "image" | "document";

export const UPLOAD_RULES: Record<
  UploadKind,
  { mimes: readonly string[]; maxBytes: number; label: string }
> = {
  // Batas 4 MB karena platform seperti Vercel membatasi body request ke ~4.5 MB.
  // Naikkan kalau tidak deploy ke platform dengan batas itu.
  image: {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 4 * 1024 * 1024,
    label: "gambar (JPG, PNG, WEBP)",
  },
  document: {
    mimes: ["application/pdf"],
    maxBytes: 4 * 1024 * 1024,
    label: "dokumen PDF",
  },
};

// Folder tujuan yang diizinkan dan jenis file yang boleh masuk ke tiap folder.
// Tambah entri baru di sini kalau modul baru butuh upload.
export const UPLOAD_FOLDERS = {
  avatars: ["image"],
  forum: ["image"],
  reports: ["image", "document"],
  activities: ["image", "document"],
} as const satisfies Record<string, readonly UploadKind[]>;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

// Batas kasar ukuran seluruh request (file + overhead multipart)
export const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
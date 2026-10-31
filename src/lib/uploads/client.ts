import { UPLOAD_FOLDERS, UPLOAD_RULES, type UploadFolder } from "./config";

export type UploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
};

export async function uploadFile(file: File, folder: UploadFolder): Promise<UploadResult> {
  // Pengecekan awal supaya pengguna cepat dapat pesan error.
  // Validasi sebenarnya tetap dilakukan server.
  const biggest = Math.max(...UPLOAD_FOLDERS[folder].map((k) => UPLOAD_RULES[k].maxBytes));
  if (file.size > biggest) {
    throw new Error(`Ukuran file maksimal ${Math.round(biggest / 1024 / 1024)} MB`);
  }

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Upload gagal");
  return data as UploadResult;
}
// Slug untuk alamat laporan, mis. "wifi-kampus-lambat-k3x9ab". Fungsi murni agar mudah diuji.

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const MAX_BASE_LENGTH = 50;
const SUFFIX_LENGTH = 6;

/** Mengubah teks menjadi bentuk URL: huruf kecil, tanpa aksen, dipisah tanda hubung. */
export function slugify(text: string, maxLength = MAX_BASE_LENGTH, fallback = "laporan"): string {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return base || fallback;
}

/** Akhiran acak (huruf kecil dan angka). `bytes` boleh diberikan untuk pengujian. */
export function randomSuffix(
  length = SUFFIX_LENGTH,
  bytes: Uint8Array = globalThis.crypto.getRandomValues(new Uint8Array(length)),
): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Slug laporan: judul yang dinormalkan + akhiran acak. Keunikan dijaga indeks unik di database. */
export function generateReportSlug(title: string, suffix: string = randomSuffix()): string {
  return `${slugify(title)}-${suffix}`;
}

/** Alamat lama berbentuk nomor (/laporan/4); dipakai untuk mengalihkan ke slug. */
export function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

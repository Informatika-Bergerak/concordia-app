export function formatRupiah(value: number): string {
  return `Rp. ${value.toLocaleString("id-ID")}`;
}

/** Format dd/mm/yyyy memakai UTC agar hasil server dan client sama. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

/** Ambil angka dari input teks; kosong menghasilkan null. */
export function parseDigits(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  return digits === "" ? null : Number(digits);
}

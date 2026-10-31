import { randomInt } from "node:crypto";

const LOWER = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SPECIAL = "!@#$%&*?";

const pick = (chars: string) => chars[randomInt(chars.length)];

// Selalu memenuhi aturan: huruf besar, huruf kecil, angka, karakter khusus
export function generateTempPassword(length = 12): string {
  const all = LOWER + UPPER + DIGITS + SPECIAL;
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  while (chars.length < length) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
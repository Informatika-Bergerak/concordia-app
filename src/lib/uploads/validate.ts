import "server-only";
import { UPLOAD_RULES, type UploadKind } from "./config";

// Mengenali tipe file dari beberapa byte pertama, bukan dari nama atau tipe kiriman browser
function detectMime(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";

  if (
    b.length >= 8 &&
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }

  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  if (b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";

  return null;
}

function formatMb(bytes: number) {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

export type ValidatedUpload =
  | { ok: true; buffer: Buffer; mime: string; kind: UploadKind }
  | { ok: false; error: string; status: number };

export async function validateUpload(
  file: File,
  allowed: readonly UploadKind[],
): Promise<ValidatedUpload> {
  const allowedLabel = allowed.map((k) => UPLOAD_RULES[k].label).join(" atau ");

  if (file.size === 0) return { ok: false, error: "File kosong", status: 400 };

  // Tolak lebih awal sebelum file dibaca ke memori
  const biggestAllowed = Math.max(...allowed.map((k) => UPLOAD_RULES[k].maxBytes));
  if (file.size > biggestAllowed) {
    return { ok: false, error: `Ukuran file maksimal ${formatMb(biggestAllowed)}`, status: 413 };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(buffer);

  const kind = allowed.find((k) => mime !== null && UPLOAD_RULES[k].mimes.includes(mime));
  if (!mime || !kind) {
    return { ok: false, error: `Tipe file tidak didukung. Hanya ${allowedLabel}`, status: 415 };
  }

  const rule = UPLOAD_RULES[kind];
  if (buffer.length > rule.maxBytes) {
    return {
      ok: false,
      error: `Ukuran ${rule.label} maksimal ${formatMb(rule.maxBytes)}`,
      status: 413,
    };
  }

  return { ok: true, buffer, mime, kind };
}
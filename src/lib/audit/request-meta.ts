import "server-only";

import { headers } from "next/headers";
import { getIpFromHeaders } from "@/lib/auth/rate-limit";

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

/**
 * Dipakai di Server Action — membaca headers() secara async (Next.js 16).
 */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const rawIp = getIpFromHeaders(h);
  const rawUa = h.get("user-agent");
  return {
    ip: rawIp === "unknown" ? null : rawIp,
    userAgent: rawUa ? summarizeUserAgent(rawUa) : null,
  };
}

/**
 * Dipakai di authorize() — menerima objek Request langsung.
 */
export function metaFromRequest(request: Request | undefined): RequestMeta {
  if (!request?.headers) {
    return { ip: null, userAgent: null };
  }
  const rawIp = getIpFromHeaders(request.headers);
  const rawUa = request.headers.get("user-agent");
  return {
    ip: rawIp === "unknown" ? null : rawIp,
    userAgent: rawUa ? summarizeUserAgent(rawUa) : null,
  };
}

/**
 * Meringkas user-agent string menjadi teks pendek yang dapat dibaca manusia.
 * Contoh: "Chrome di Windows", "Safari di iOS", "Perangkat tidak dikenal"
 * Tanpa library eksternal.
 */
export function summarizeUserAgent(ua: string): string {
  const s = ua.slice(0, 512);

  // Deteksi OS
  let os = "";
  if (/iPhone|iPad|iPod/.test(s)) {
    os = "iOS";
  } else if (/Android/.test(s)) {
    os = "Android";
  } else if (/Windows NT/.test(s)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/.test(s)) {
    os = "macOS";
  } else if (/Linux/.test(s)) {
    os = "Linux";
  }

  // Deteksi browser (urutan penting: Edge sebelum Chrome, OPR sebelum Chrome)
  let browser = "";
  if (/Edg\//.test(s)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/.test(s)) {
    browser = "Opera";
  } else if (/SamsungBrowser/.test(s)) {
    browser = "Samsung Browser";
  } else if (/Firefox\//.test(s)) {
    browser = "Firefox";
  } else if (/Chrome\//.test(s)) {
    browser = "Chrome";
  } else if (/Safari\//.test(s)) {
    browser = "Safari";
  } else if (/MSIE|Trident/.test(s)) {
    browser = "Internet Explorer";
  }

  if (browser && os) return `${browser} di ${os}`;
  if (browser) return browser;
  if (os) return `Perangkat ${os}`;
  return "Perangkat tidak dikenal";
}

import { mockReports } from "./mock";
import type { ReportItem } from "./types";

// Sementara memakai data contoh. Ganti isi fungsi ini dengan query Prisma
// tanpa mengubah halaman yang memanggilnya.
export async function getReports(): Promise<ReportItem[]> {
  return mockReports;
}

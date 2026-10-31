import { mockFeed } from "./mock";
import type { FeedPost } from "./types";

// Sementara memakai data contoh. Nanti ganti isi fungsi ini dengan query Prisma
// tanpa mengubah halaman yang memanggilnya.
export async function getFeed(): Promise<FeedPost[]> {
  return mockFeed;
}
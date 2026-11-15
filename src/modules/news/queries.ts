import "server-only";

import { prisma } from "@/lib/db";

export type AdminNewsItem = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  timeAgo: string;
};

function timeAgo(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

export async function getAdminNews(): Promise<AdminNewsItem[]> {
  const rows = await prisma.adminNews.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  return rows.map((news) => ({
    id: String(news.id),
    title: news.title,
    content: news.content,
    authorName: news.author.name,
    timeAgo: timeAgo(news.createdAt),
  }));
}

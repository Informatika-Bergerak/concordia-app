/**
 * DATA SEMENTARA untuk UI sisi penjual, pesan, dan pemberitahuan.
 * Ganti dengan query Prisma saat backend Marketplace selesai.
 */
import { getMockListing } from "./mock-data";
import type { NotificationItem } from "./types";
import type {
  Announcement,
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
  InsightPeriod,
  InsightStats,
  ListingComment,
  SellerListing,
  SellerStats,
} from "./seller-types";

const SELLER_ITEMS: { slug: string; views: number; active: boolean }[] = [
  { slug: "helikopter-second-2019", views: 0, active: true },
  { slug: "asus-tuf-gaming-f15", views: 0, active: true },
  { slug: "buku-algoritma-dan-struktur-data", views: 12, active: false },
];

export function getSellerListings(): SellerListing[] {
  const result: SellerListing[] = [];
  for (const item of SELLER_ITEMS) {
    const listing = getMockListing(item.slug);
    if (!listing) continue;
    result.push({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price,
      photoUrl: listing.photoUrl,
      availability: listing.availability,
      postedAt: "2026-11-17T00:00:00.000Z",
      views: item.views,
      active: item.active,
    });
  }
  return result;
}

export function getSellerListing(slug: string): SellerListing | null {
  return getSellerListings().find((item) => item.slug === slug) ?? null;
}

export function getSellerStats(): SellerStats {
  return { pendingChats: 3, totalSales: 99, needsAttention: 0, activeCount: 5, soldCount: 8, inactiveCount: 5 };
}

export function getInsightByPeriod(): Record<InsightPeriod, InsightStats> {
  return {
    7: { views: 100, directOffers: 7, saved: 3, shared: 2 },
    30: { views: 412, directOffers: 21, saved: 15, shared: 9 },
    90: { views: 1280, directOffers: 64, saved: 47, shared: 31 },
  };
}

export function getListingComments(): ListingComment[] {
  return [
    { id: 1, author: "Isan Wibu", ago: "5 Jam Yang Lalu", text: "Apa ini masih ada?" },
    { id: 2, author: "Shula Khalid", ago: "2 Jam Yang Lalu", text: "Bisa COD di sekitar kampus?" },
  ];
}

export function getConversations(): ConversationSummary[] {
  return [
    { id: 1, name: "Adrian", lastMessage: "Barangnya bisa lebih murah ga ?", time: "15.00", unread: 1 },
    { id: 2, name: "Erlangga Y P", lastMessage: "RP. 100.000,00 Ditawarkan untuk barang ini.", time: "15.00", unread: 0 },
  ];
}

export function getAnnouncements(): Announcement[] {
  return [];
}

export function getBuyerNotifications(): NotificationItem[] {
  return [
    { id: 1, title: "Tawaran Baru Untuk Anda", text: "Temukan penawaran helikopter baru.", date: "2026-11-18T00:00:00.000Z", slug: "helikopter-second-2019" },
    { id: 2, title: "Balasan Dari Erlangga Yuda", text: 'Erlangga Yuda: "Harga masih bisa nego."', date: "2026-11-17T00:00:00.000Z", slug: "asus-tuf-gaming-f15" },
  ];
}

const DATE_LABEL = "1 Oktober 2026";

const MOCK_CONVERSATIONS: Record<string, ConversationDetail> = {
  "1": {
    id: "1",
    partnerName: "Adrian",
    listingSlug: "asus-tuf-gaming-f15",
    dateLabel: DATE_LABEL,
    messages: [
      { id: 1, sender: "them", name: "Adrian", time: "15.00", kind: "text", text: "Barangnya bisa lebih murah ga ?" },
      { id: 2, sender: "me", name: "Anda", time: "15.05", kind: "text", text: "Masih bisa nego, silakan tawarkan harga." },
    ],
  },
  "2": {
    id: "2",
    partnerName: "Erlangga Y P",
    listingSlug: "asus-tuf-gaming-f15",
    dateLabel: DATE_LABEL,
    messages: [
      { id: 1, sender: "them", name: "Erlangga Y P", time: "15.00", kind: "offer", offerAmount: 100_000, text: "Ditawarkan untuk barang ini." },
    ],
  },
  "3": {
    id: "3",
    partnerName: "Erlangga Yuda Pratama",
    listingSlug: "helikopter-second-2019",
    dateLabel: DATE_LABEL,
    messages: [
      { id: 1, sender: "me", name: "Anda", time: "15.00", kind: "text", text: "Apakah barang ini masih ada ?" },
      { id: 2, sender: "me", name: "Anda", time: "15.00", kind: "listing" },
      { id: 3, sender: "them", name: "Erlangga Yuda Pratama", time: "15.00", kind: "text", text: "Masih ada banyak bang" },
    ],
  },
};

/** Percakapan baru dari halaman detail penawaran (Kirim Pesan / Kirim Tawaran). */
export function buildNewConversation(listingSlug: string, offerAmount: number | null): ConversationDetail | null {
  const listing = getMockListing(listingSlug);
  if (!listing) return null;
  const messages: ChatMessage[] = [{ id: 1, sender: "me", name: "Anda", time: "", kind: "listing" }];
  if (offerAmount !== null) {
    messages.push({ id: 2, sender: "me", name: "Anda", time: "", kind: "offer", offerAmount, text: "Ditawarkan untuk barang ini." });
  }
  return { id: "baru", partnerName: listing.seller.name, listingSlug, dateLabel: "Hari ini", messages };
}

export function getConversationDetail(id: string): ConversationDetail | null {
  return MOCK_CONVERSATIONS[id] ?? null;
}

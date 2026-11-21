import type { ListingAvailability } from "./types";

export type InsightPeriod = 7 | 30 | 90;

export type InsightStats = {
  views: number;
  directOffers: number;
  saved: number;
  shared: number;
};

export type SellerStats = {
  pendingChats: number;
  totalSales: number;
  needsAttention: number;
  activeCount: number;
  soldCount: number;
  inactiveCount: number;
};

export type SellerListing = {
  id: number;
  slug: string;
  title: string;
  price: number;
  photoUrl: string | null;
  availability: ListingAvailability;
  postedAt: string;
  views: number;
  active: boolean;
};

export type ListingComment = {
  id: number;
  author: string;
  ago: string;
  text: string;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
};

export type ConversationSummary = {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
};

export type ChatMessage = {
  id: number;
  sender: "me" | "them";
  name: string;
  time: string;
  kind: "text" | "listing" | "offer";
  text?: string;
  offerAmount?: number;
};

export type ConversationDetail = {
  id: string;
  partnerName: string;
  listingSlug: string | null;
  dateLabel: string;
  messages: ChatMessage[];
};

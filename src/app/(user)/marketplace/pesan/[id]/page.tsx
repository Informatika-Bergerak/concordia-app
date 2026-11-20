import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { ConversationView } from "@/components/marketplace/conversation-view";
import { getMockListing } from "@/modules/marketplace/mock-data";
import { buildNewConversation, getConversationDetail } from "@/modules/marketplace/seller-mock-data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ listing?: string; offer?: string }>;
};

export default async function ConversationPage({ params, searchParams }: Props) {
  await requireRole(["USER", "MODERATOR"]);
  const { id } = await params;
  const { listing: listingSlug, offer } = await searchParams;

  let conversation = null;
  if (id === "baru" && listingSlug) {
    const amount = offer && /^\d+$/.test(offer) ? Number(offer) : null;
    conversation = buildNewConversation(listingSlug, amount);
  } else {
    conversation = getConversationDetail(id);
  }
  if (!conversation) notFound();

  const detail = conversation.listingSlug ? getMockListing(conversation.listingSlug) : null;
  const listing = detail
    ? {
        id: detail.id,
        slug: detail.slug,
        title: detail.title,
        price: detail.price,
        location: detail.location,
        photoUrl: detail.photoUrl,
        category: detail.category,
        condition: detail.condition,
        availability: detail.availability,
      }
    : null;

  const backHref = id === "baru" && listingSlug ? `/marketplace/${listingSlug}` : "/marketplace/jual";
  return <ConversationView conversation={conversation} listing={listing} backHref={backHref} />;
}

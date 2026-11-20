import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { SellerListingView } from "@/components/marketplace/seller-listing-view";
import {
  getConversations,
  getInsightByPeriod,
  getListingComments,
  getSellerListing,
} from "@/modules/marketplace/seller-mock-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SellerListingPage({ params }: Props) {
  await requireRole(["USER", "MODERATOR"]);
  const { slug } = await params;
  const listing = getSellerListing(slug);
  if (!listing) notFound();

  // TODO: pastikan tawaran milik pengguna yang login saat data berasal dari database.
  return (
    <SellerListingView
      listing={listing}
      comments={getListingComments()}
      conversations={getConversations()}
      insight={getInsightByPeriod()}
    />
  );
}

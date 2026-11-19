import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { ListingDetailView } from "@/components/marketplace/listing-detail";
import { getMockListing } from "@/modules/marketplace/mock-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  await requireRole(["USER", "MODERATOR"]);
  const { slug } = await params;
  const listing = getMockListing(slug);
  if (!listing) notFound();

  // TODO: isOwner = listing.sellerId === user.id saat data berasal dari database.
  return <ListingDetailView listing={listing} />;
}

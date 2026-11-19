import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { ListingForm } from "@/components/marketplace/listing-form";
import { getMockListing } from "@/modules/marketplace/mock-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditListingPage({ params }: Props) {
  await requireRole(["USER", "MODERATOR"]);
  const { slug } = await params;
  const listing = getMockListing(slug);
  if (!listing) notFound();

  // TODO: tolak (notFound/redirect) bila pengguna bukan pemilik tawaran.
  return (
    <ListingForm
      mode="edit"
      currentPhotoUrl={listing.photoUrl}
      initialValues={{
        title: listing.title,
        price: String(listing.price),
        category: listing.category,
        condition: listing.condition,
        availability: listing.availability,
        description: listing.description,
        location: listing.location,
        allowCod: listing.allowCod,
        allowShipping: listing.allowShipping,
      }}
    />
  );
}

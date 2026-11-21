import { requireRole } from "@/lib/auth/guards";
import { ListingForm } from "@/components/marketplace/listing-form";

export default async function NewListingPage() {
  await requireRole(["USER", "MODERATOR"]);
  return <ListingForm mode="create" />;
}

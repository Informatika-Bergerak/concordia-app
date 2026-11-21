import { requireRole } from "@/lib/auth/guards";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { getMockListings } from "@/modules/marketplace/mock-data";

export const metadata = { title: "Marketplace" };

export default async function MarketplacePage() {
  await requireRole(["USER", "MODERATOR"]);
  // TODO: ganti dengan query Prisma saat backend Marketplace selesai.
  return <MarketplaceBrowser listings={getMockListings()} />;
}

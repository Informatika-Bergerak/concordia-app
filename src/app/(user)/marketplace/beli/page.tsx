import { requireRole } from "@/lib/auth/guards";
import { BuyMenu } from "@/components/marketplace/buy-menu";
import { getMockNotifications, getMockOffers, getMockSaved } from "@/modules/marketplace/mock-data";

export default async function BuyMenuPage() {
  await requireRole(["USER", "MODERATOR"]);
  // TODO: ganti dengan data milik pengguna dari database.
  return <BuyMenu offers={getMockOffers()} saved={getMockSaved()} notifications={getMockNotifications()} />;
}

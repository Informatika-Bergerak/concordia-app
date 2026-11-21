import { requireRole } from "@/lib/auth/guards";
import { SellerMenu } from "@/components/marketplace/seller-menu";
import {
  getAnnouncements,
  getInsightByPeriod,
  getSellerListings,
  getSellerStats,
} from "@/modules/marketplace/seller-mock-data";

export const metadata = { title: "Menu Jual" };

export default async function SellerMenuPage() {
  await requireRole(["USER", "MODERATOR"]);
  // TODO: ganti dengan data milik penjual dari database.
  return (
    <SellerMenu
      listings={getSellerListings()}
      stats={getSellerStats()}
      insight={getInsightByPeriod()}
      announcements={getAnnouncements()}
    />
  );
}

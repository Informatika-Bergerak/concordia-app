import { redirect } from "next/navigation";

// Alamat lama (Forum Jual Beli). Marketplace sekarang berada di /marketplace.
export default function Page() {
  redirect("/marketplace");
}

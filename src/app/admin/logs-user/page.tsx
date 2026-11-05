import { redirect } from "next/navigation";

export default function LogsUserRedirectPage() {
  redirect("/admin/audit-logs");
}


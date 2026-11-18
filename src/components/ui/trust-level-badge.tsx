import type { Role } from "@/generated/prisma/enums";
import { levelForXp } from "@/modules/trust/progression";
import styles from "./trust-level-badge.module.css";

export function TrustLevelBadge({ role, trustScore }: { role: Role; trustScore: number }) {
  if (role === "ADMIN") return null;
  return <span className={styles.badge}>Lv. {levelForXp(trustScore)}</span>;
}

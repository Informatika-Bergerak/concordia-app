import { Plus } from "lucide-react";
import styles from "./composer.module.css";

export function Composer() {
  return (
    <section className={styles.card}>
      <input
        className={styles.field}
        placeholder="Apa yang anda pikirkan ?..."
        readOnly
        aria-label="Tulis postingan"
      />
      <button type="button" className={styles.add} aria-label="Buat postingan">
        <Plus size={18} />
      </button>
    </section>
  );
}
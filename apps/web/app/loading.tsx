import Image from "next/image";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.strobing}>
        <Image src="/logo.png" alt="Loading..." width={80} height={80} />
        <p className={styles.text}>Loading Dashboard...</p>
      </div>
    </div>
  );
}

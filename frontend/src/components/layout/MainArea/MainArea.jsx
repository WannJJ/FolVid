import { HamburgerButton } from "@/components/ui";
import styles from "./MainArea.module.css";
export function MainArea({ children }) {
  return (
    <>
      <HamburgerButton />
      <main className={styles.mainArea}>{children}</main>
    </>
  );
}

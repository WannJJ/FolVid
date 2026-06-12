import { useUIStore } from "@/stores/useUIStore";
import styles from "./HamburgerButton.module.css";

/* Nút hamburger chỉ hiện trên mobile */
export function HamburgerButton() {
  const { toggleSidebar, sidebarOpen } = useUIStore();
  return (
    <button
      className={styles.menuToggle}
      onClick={toggleSidebar}
      aria-label="Mở/đóng danh sách video"
    >
      {sidebarOpen ? "✕" : "☰"}
    </button>
  );
}

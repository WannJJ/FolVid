import { useUIStore } from "@/stores/useUIStore";
import styles from "./SideBar.module.css";
export default function SideBar({ children }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  return (
    <>
      {/* Overlay để đóng sidebar khi bấm ra ngoài */}
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.open : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        {children}
      </aside>
    </>
  );
}

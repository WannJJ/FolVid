import { useUIStore } from "@/stores/useUIStore";
import { useEffect } from "react";
import styles from "./SideBar.module.css";
export default function SideBar({ children }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    const handler = (e) => {
      // Chỉ prevent nếu click vào vùng của sidebar
      //if (e.target.closest(".sidebar")) {
      if (e.target.closest(`.${styles.sidebar}`)) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

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

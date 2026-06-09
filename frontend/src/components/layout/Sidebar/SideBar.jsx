import styles from "./SideBar.module.css";
export default function SideBar({
  sidebarOpen,

  children,
}) {
  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
      {children}
    </aside>
  );
}

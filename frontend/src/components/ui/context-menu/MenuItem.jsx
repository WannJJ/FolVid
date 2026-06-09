import styles from "./MenuItem.module.css";

export default function MenuItem({ onClick, label, icon }) {
  return (
    <div
      className={styles.menuItem}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

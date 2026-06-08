import styles from "./VideoList.module.css";

export default function SearchBar({ search, setSearch }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <input
        type="text"
        placeholder="🔍 Tìm theo tên, nghệ sĩ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />
    </div>
  );
}

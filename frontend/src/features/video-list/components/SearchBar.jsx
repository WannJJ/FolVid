import { useTranslation } from "react-i18next";
import styles from "./VideoList.module.css";

export function SearchBar({ search, setSearch }) {
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: "12px" }}>
      <input
        type="text"
        placeholder={t("videoList.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />
    </div>
  );
}

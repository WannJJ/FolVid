import { useVideoStore } from "@/stores/useVideoStore";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./FilterPanel.module.css";

export function FilterPanel({ setFilters, filters, setSearch }) {
  const { videos } = useVideoStore();
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false); // đóng/mở panel

  const genres = useMemo(() => {
    const set = new Set(videos.map((v) => v.custom.genre).filter(Boolean));
    return ["", ...Array.from(set).sort()];
  }, [videos]);

  const artists = useMemo(() => {
    const set = new Set(videos.map((v) => v.custom.artist).filter(Boolean));
    return ["", ...Array.from(set).sort()];
  }, [videos]);

  const resolutions = useMemo(() => {
    const set = new Set(
      videos
        .map((v) => (v.width && v.height ? `${v.width}x${v.height}` : null))
        .filter(Boolean),
    );
    return ["", ...Array.from(set).sort()];
  }, [videos]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={styles.filterToggle}
      >
        <span>{t("filter.title")}</span>
        <span>{showFilters ? "▲" : "▼"}</span>
      </button>

      <div
        className={`${styles.filterWrapper} ${showFilters ? styles.open : ""}`}
      >
        <div className={styles.filterInner}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div className={styles.filterContent}>
              {/* Genre */}
              <div>
                <label className={styles.filterLabel}>
                  {t("filter.genre")}
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, genre: e.target.value }))
                  }
                  className={styles.filterSelect}
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g || t("filter.all")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Artist */}
              <div>
                <label className={styles.filterLabel}>
                  {t("filter.artist")}
                </label>
                <select
                  value={filters.artist}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, artist: e.target.value }))
                  }
                  className={styles.filterSelect}
                >
                  {artists.map((a) => (
                    <option key={a} value={a}>
                      {a || t("filter.all")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Range */}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.filterLabel}>
                    {t("filter.minDuration")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.minDuration}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, minDuration: e.target.value }))
                    }
                    className={styles.filterInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#888", fontSize: "0.8rem" }}>
                    {t("filter.maxDuration")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.maxDuration}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, maxDuration: e.target.value }))
                    }
                    className={styles.filterInput}
                  />
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label style={{ color: "#888", fontSize: "0.8rem" }}>
                  {t("filter.resolution")}
                </label>
                <select
                  value={filters.resolution}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, resolution: e.target.value }))
                  }
                  className={styles.filterSelect}
                >
                  {resolutions.map((r) => (
                    <option key={r} value={r}>
                      {r || t("filter.all")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút xóa filter */}
              <button
                onClick={() => {
                  setSearch("");
                  setFilters({
                    genre: "",
                    artist: "",
                    minDuration: "",
                    maxDuration: "",
                    resolution: "",
                  });
                }}
                className={styles.clearFiltersBtn}
              >
                ✕ {t("filter.clearFilters")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

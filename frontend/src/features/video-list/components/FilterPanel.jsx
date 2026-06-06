import styles from "./FilterPanel.module.css";

export default function FilterPanel({
  setShowFilters,
  showFilters,
  setFilters,
  genres,
  filters,
  artists,
  resolutions,
  setSearch,
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={styles.filterToggle}
      >
        <span>⚙️ Bộ lọc nâng cao</span>
        <span>{showFilters ? "▲" : "▼"}</span>
      </button>

      {showFilters && (
        <div className={styles.filterContent}>
          {/* Genre */}
          <div>
            <label className={styles.filterLabel}>Thể loại</label>
            <select
              value={filters.genre}
              onChange={(e) =>
                setFilters((f) => ({ ...f, genre: e.target.value }))
              }
              className={styles.filterSelect}
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g || "— Tất cả —"}
                </option>
              ))}
            </select>
          </div>

          {/* Artist */}
          <div>
            <label className={styles.filterLabel}>Nghệ sĩ</label>
            <select
              value={filters.artist}
              onChange={(e) =>
                setFilters((f) => ({ ...f, artist: e.target.value }))
              }
              className={styles.filterSelect}
            >
              {artists.map((a) => (
                <option key={a} value={a}>
                  {a || "— Tất cả —"}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Range */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label className={styles.filterLabel}>Min (phút)</label>
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
                Max (phút)
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
              Độ phân giải
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
                  {r || "— Tất cả —"}
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
            ✕ Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

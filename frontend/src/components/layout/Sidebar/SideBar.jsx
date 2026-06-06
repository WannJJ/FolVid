import styles from "./SideBar.module.css";
export default function SideBar({
  sidebarOpen,
  videos,
  search,
  setSearch,
  setShowFilters,
  showFilters,
  filters,
  setFilters,
  genres,
  artists,
  resolutions,
  filteredVideos,
  handleDropFile,
  handleDragOver,
  handleDragLeave,
  isDraggingFile,
  handleFileSelect,
  children,
}) {
  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
      <h2>📁 FolVid</h2>
      <p className={styles.count}>{videos.length} video trong thư mục</p>

      {/* ===== SEARCH BAR ===== */}
      <div style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên, nghệ sĩ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      {/* ===== FILTER PANEL (Accordion) ===== */}
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

      {/* ===== DANH SÁCH VIDEO ===== */}
      <p className={styles.videoCount}>
        {filteredVideos.length} / {videos.length} video
      </p>
      <ul className={styles.videoList}>{children}</ul>

      {/* ===== DRAG & DROP ===== */}
      <div
        onDrop={handleDropFile}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`${styles.dropZone} ${isDraggingFile ? styles.dropZoneDragging : ""}`}
      >
        <input
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          id="fileInput"
          onChange={handleFileSelect}
        />
        <label htmlFor="fileInput" className={styles.dropZoneLabel}>
          {isDraggingFile
            ? "Thả file vào đây"
            : "Kéo thả video vào đây, hoặc click để chọn"}
        </label>
      </div>
    </aside>
  );
}

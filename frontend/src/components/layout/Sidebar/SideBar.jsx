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
      <p className="count">{videos.length} video trong thư mục</p>

      {/* ===== SEARCH BAR ===== */}
      <div style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên, nghệ sĩ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "#2a2a2a",
            color: "#fff",
            fontSize: "0.9rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      {/* ===== FILTER PANEL (Accordion) ===== */}
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: "4px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚙️ Bộ lọc nâng cao</span>
          <span>{showFilters ? "▲" : "▼"}</span>
        </button>

        {showFilters && (
          <div
            style={{
              marginTop: "8px",
              padding: "12px",
              background: "#252525",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Genre */}
            <div>
              <label style={{ color: "#888", fontSize: "0.8rem" }}>
                Thể loại
              </label>
              <select
                value={filters.genre}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, genre: e.target.value }))
                }
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  background: "#1e1e1e",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
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
              <label style={{ color: "#888", fontSize: "0.8rem" }}>
                Nghệ sĩ
              </label>
              <select
                value={filters.artist}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, artist: e.target.value }))
                }
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  background: "#1e1e1e",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
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
                <label style={{ color: "#888", fontSize: "0.8rem" }}>
                  Min (phút)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minDuration}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, minDuration: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "6px",
                    background: "#1e1e1e",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
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
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "6px",
                    background: "#1e1e1e",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
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
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  background: "#1e1e1e",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
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
              style={{
                marginTop: "4px",
                padding: "8px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ✕ Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ===== DANH SÁCH VIDEO ===== */}
      <p style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "12px" }}>
        {filteredVideos.length} / {videos.length} video
      </p>
      <ul className="video-list">{children}</ul>

      <div
        onDrop={handleDropFile}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: isDraggingFile ? "2px dashed #3b82f6" : "2px dashed #555",
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px",
          borderRadius: "8px",
          background: isDraggingFile ? "#1a2f4a" : "#2a2a2a",
          cursor: "pointer",
        }}
      >
        <input
          type="file"
          accept="video/*"
          style={{ display: " ne" }}
          id="fileInput"
          onChange={handleFileSelect}
        />
        <label htmlFor="fileInput" style={{ cursor: "pointer", color: "#fff" }}>
          {isDraggingFile
            ? "Thả file vào đây"
            : "Kéo thả video vào đây, hoặc click để chọn"}
        </label>
      </div>
    </aside>
  );
}

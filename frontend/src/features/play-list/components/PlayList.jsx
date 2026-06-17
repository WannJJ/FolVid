import styles from "./PlayList.module.css";

export function PlayList({
  playlist,
  handleDragEnd,
  handleDragOver,
  handleDragStart,
  playAtIndex,
  currentIndex,
  removeFromPlaylist,
}) {
  return (
    <aside style={styles.playlistPanel}>
      <div style={styles.playlistHeader}>
        <span>📋 Playlist</span>
        <span style={styles.playlistCount}>{playlist.length} video</span>
      </div>
      <div style={styles.playlistList}>
        {playlist.length === 0 ? (
          <div
            style={{
              padding: "20px",
              color: "#666",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            Playlist trống.
            <br />
            Click <strong>+</strong> bên trái để thêm video.
          </div>
        ) : (
          playlist.map((v, index) => (
            <div
              key={`${v}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => playAtIndex(index)}
              style={{
                ...styles.playlistItem,
                ...(index === currentIndex
                  ? styles.playlistItemPlaying
                  : styles.playlistItemNormal),
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                <span style={styles.dragHandle}>⋮⋮</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "180px",
                  }}
                >
                  {index === currentIndex ? "▶ " : `${index + 1}. `}
                  {v}
                </span>
              </span>
              <button
                style={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromPlaylist(index);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

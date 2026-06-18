// src/features/playlist/PlaylistPanel.jsx
import usePlaylistStore from "@/stores/usePlaylistStore";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { useEffect } from "react";
import { PlaylistItem } from "./PlaylistItem";

export function PlaylistPanel() {
  const {
    playlist,
    currentIndex,
    isRepeat,
    isShuffle,
    playAtIndex,
    removeFromPlaylist,
    reorderPlaylist,
    playNext,
    playPrevious,
    toggleRepeat,
    toggleShuffle,
    deletePlaylist,
    getCurrentVideo,
  } = usePlaylistStore();

  const { setCurrentVideo } = useVideoStore();

  // UI state
  const isPlaylistOpen = useUIStore((state) => state.isPlaylistOpen);
  const togglePlaylist = useUIStore((state) => state.togglePlaylist);
  const isMobile = useUIStore((state) => state.isMobile);

  // Đồng bộ currentVideo khi playlist thay đổi
  useEffect(() => {
    if (playlist !== null) {
      const current = getCurrentVideo();
      setCurrentVideo(current);
    }
  }, [playlist, currentIndex, getCurrentVideo, setCurrentVideo]);

  if (playlist === null) return null;

  const currentVideo = getCurrentVideo();

  return (
    <>
      {/* Overlay backdrop cho mobile khi playlist mở */}
      {isMobile && isPlaylistOpen && (
        <div className="playlist-overlay" onClick={togglePlaylist} />
      )}
      <aside
        className={`playlist-panel ${isPlaylistOpen ? "open" : "closed"} ${isMobile ? "mobile" : ""}`}
      >
        {/* Header với nút toggle */}
        <div className="playlist-header">
          <div className="playlist-title">
            <span>📋 Playlist</span>
            <span className="playlist-count">{playlist.length} video</span>
          </div>
          <div className="playlist-actions">
            <button
              className="btn-toggle-playlist"
              onClick={togglePlaylist}
              title={isPlaylistOpen ? "Ẩn playlist" : "Hiện playlist"}
            >
              {isPlaylistOpen ? "▶" : "◀"}
            </button>
            <button
              className="btn-delete-playlist"
              onClick={deletePlaylist}
              title="Xóa playlist"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Controls */}
        {isPlaylistOpen && (
          <div className="playlist-controls">
            <button
              className={`ctrl-btn ${isShuffle ? "active" : ""}`}
              onClick={toggleShuffle}
            >
              🔀
            </button>
            <button
              className="ctrl-btn"
              onClick={playPrevious}
              disabled={currentIndex <= 0}
            >
              ⏮️
            </button>
            <button
              className="ctrl-btn"
              onClick={playNext}
              disabled={
                currentIndex >= playlist.length - 1 && !isRepeat && !isShuffle
              }
            >
              ⏭️
            </button>
            <button
              className={`ctrl-btn ${isRepeat ? "active" : ""}`}
              onClick={toggleRepeat}
            >
              🔁
            </button>
          </div>
        )}

        {/* List - vẫn hiện ngay cả khi đóng (thu gọn) */}
        <div className={`playlist-list ${isPlaylistOpen ? "" : "collapsed"}`}>
          {playlist.length === 0 ? (
            <div className="playlist-empty">
              Playlist trống.
              <br />
              Chọn video từ thư viện để thêm.
            </div>
          ) : (
            playlist.map((video, index) => (
              <PlaylistItem
                key={`${video.filename}-${index}`}
                video={video}
                index={index}
                isPlaying={index === currentIndex}
                isCollapsed={!isPlaylistOpen}
                onPlay={() => playAtIndex(index)}
                onRemove={() => removeFromPlaylist(index)}
                onReorder={reorderPlaylist}
              />
            ))
          )}
        </div>

        {/* Hiển thị thông tin video đang phát */}
        {/* Now playing info */}
        {isPlaylistOpen && currentVideo && (
          <div className="now-playing-info">
            <p className="now-playing-title">{currentVideo.filename}</p>
            <p className="now-playing-meta">
              {currentVideo.duration && formatDuration(currentVideo.duration)}
              {currentVideo.width &&
                ` • ${currentVideo.width}x${currentVideo.height}`}
            </p>
          </div>
        )}
      </aside>

      {/* Floating toggle button khi playlist đóng (desktop) */}
      {!isMobile && !isPlaylistOpen && (
        <button
          className="playlist-floating-toggle"
          onClick={togglePlaylist}
          title="Hiện playlist"
        >
          📋 {playlist.length}
        </button>
      )}
    </>
  );
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

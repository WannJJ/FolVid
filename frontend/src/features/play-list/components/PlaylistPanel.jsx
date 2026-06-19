// src/features/playlist/PlaylistPanel.jsx
import usePlaylistStore from "@/stores/usePlaylistStore";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { formatTime } from "@/utils/formatTime";
import { Repeat2, Shuffle } from "lucide-react";
import { useEffect } from "react";
import { PlaylistItem } from "./PlaylistItem";
import styles from "./PlaylistPanel.module.css";

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
        <div className={styles.playlistOverlay} onClick={togglePlaylist} />
      )}
      <aside
        className={`${styles.playlistPanel} ${isPlaylistOpen ? styles.open : styles.closed} ${isMobile ? styles.mobile : ""}`}
      >
        {/* Header với nút toggle */}
        <div className={styles.playlistHeader}>
          <div className={styles.playlistTitle}>
            <span title="Playlist">📋 {isPlaylistOpen ? "Playlist" : ""}</span>
            <span className={styles.playlistCount}>
              {playlist.length} video
            </span>
          </div>
          <div className={styles.playlistActions}>
            <button
              className={styles.btnTogglePlaylist}
              onClick={togglePlaylist}
              title={isPlaylistOpen ? "Ẩn playlist" : "Hiện playlist"}
            >
              {isPlaylistOpen ? "▶" : "◀"}
            </button>
            <button
              className={styles.btnDeletePlaylist}
              onClick={deletePlaylist}
              title="Xóa playlist"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Controls */}
        {isPlaylistOpen && (
          <div className={styles.playlistControls}>
            <button
              className={`${styles.ctrlBtn} ${isShuffle ? styles.active : ""}`}
              onClick={toggleShuffle}
            >
              <Shuffle />
            </button>
            <button
              className={styles.ctrlBtn}
              onClick={playPrevious}
              disabled={currentIndex <= 0}
            >
              ⏮
            </button>
            <button
              className={styles.ctrlBtn}
              onClick={playNext}
              disabled={
                currentIndex >= playlist.length - 1 && !isRepeat && !isShuffle
              }
            >
              ⏭
            </button>
            <button
              className={`${styles.ctrlBtn} ${isRepeat ? styles.active : ""}`}
              onClick={toggleRepeat}
            >
              <Repeat2 />
            </button>
          </div>
        )}

        {/* List - vẫn hiện ngay cả khi đóng (thu gọn) */}
        <div
          className={`${styles.playlistList} ${isPlaylistOpen ? "" : styles.collapsed}`}
        >
          {playlist.length === 0 ? (
            <div className={styles.playlistEmpty}>
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
          <div className={styles.nowPlayingInfo}>
            <p className={styles.nowPlayingTitle}>{currentVideo.filename}</p>
            <p className={styles.nowPlayingMeta}>
              {currentVideo.duration && formatTime(currentVideo.duration)}
              {currentVideo.width &&
                ` • ${currentVideo.width}x${currentVideo.height}`}
            </p>
          </div>
        )}
      </aside>

      {/* Floating toggle button khi playlist đóng (desktop) */}
      {!isMobile && !isPlaylistOpen && (
        <button
          className={styles.playlistFloatingToggle}
          onClick={togglePlaylist}
          title="Hiện playlist"
        >
          📋 {playlist.length}
        </button>
      )}
    </>
  );
}

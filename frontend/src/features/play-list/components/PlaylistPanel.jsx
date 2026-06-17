import usePlaylistStore from "@/stores/usePlaylistStore";
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

  // Đồng bộ currentVideo với playlist
  useEffect(() => {
    const current = getCurrentVideo();
    setCurrentVideo(current);
  }, [currentIndex, playlist, getCurrentVideo, setCurrentVideo]);

  // Không có playlist → không render gì
  if (playlist === null) return null;

  return (
    <aside className="playlist-panel">
      <div className="playlist-header">
        <span>📋 Playlist</span>
        <div className="playlist-actions">
          <span className="playlist-count">{playlist.length} video</span>
          <button
            className="btn-delete-playlist"
            onClick={deletePlaylist}
            title="Xóa playlist"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="playlist-controls">
        <button
          className={`ctrl-btn ${isShuffle ? "active" : ""}`}
          onClick={toggleShuffle}
          title="Shuffle"
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
          title="Repeat"
        >
          🔁
        </button>
      </div>

      <div className="playlist-list">
        {playlist.length === 0 ? (
          <div className="playlist-empty">
            Playlist trống.
            <br />
            Chọn video từ thư viện để thêm.
          </div>
        ) : (
          //TODO: Lỗi map. Check lại xem playlist, video, index là gì
          playlist.map((video, index) => (
            <PlaylistItem
              key={`${video}-${index}`}
              video={video}
              index={index}
              isPlaying={index === currentIndex}
              onPlay={() => playAtIndex(index)}
              onRemove={() => removeFromPlaylist(index)}
              onReorder={(fromIndex, toIndex) =>
                reorderPlaylist(fromIndex, toIndex)
              }
            />
          ))
        )}
      </div>
    </aside>
  );
}

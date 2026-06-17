import usePlaylistStore from "@/stores/usePlaylistStore";
import { useVideoStore } from "@/stores/useVideoStore";

export function PlaylistToggle() {
  const { playlist, createPlaylist } = usePlaylistStore();
  const { currentVideo } = useVideoStore();

  // Đã có playlist → không hiện nút tạo
  if (playlist !== null) return null;

  const handleCreatePlaylist = () => {
    // Tạo playlist từ video đang phát (nếu có) hoặc trống
    const initial = currentVideo ? [currentVideo] : [];
    createPlaylist(initial);
  };

  return (
    <button className="btn-create-playlist" onClick={handleCreatePlaylist}>
      📋 Tạo Playlist
    </button>
  );
}

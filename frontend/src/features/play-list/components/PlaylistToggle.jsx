import usePlaylistStore from "@/stores/usePlaylistStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { useTranslation } from "react-i18next";
import styles from "./PlaylistPanel.module.css";

export function PlaylistToggle() {
  const { t } = useTranslation();
  const playlist = usePlaylistStore((state) => state.playlist);
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const currentVideo = useVideoStore((state) => state.currentVideo);

  if (playlist !== null) return null;

  const handleCreatePlaylist = () => {
    // Tạo playlist từ video object đang phát (nếu có) hoặc trống
    const initial = currentVideo ? [currentVideo] : [];
    createPlaylist(initial);
  };

  return (
    <button className={styles.btnCreatePlaylist} onClick={handleCreatePlaylist}>
      📋 {t("videoList.createPlaylist")}
    </button>
  );
}

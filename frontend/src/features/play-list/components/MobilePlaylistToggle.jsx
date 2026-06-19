import usePlaylistStore from "@/stores/usePlaylistStore";
import { useUIStore } from "@/stores/useUIStore";
import styles from "./PlaylistPanel.module.css";

// Nút toggle playlist cho mobile (nổi trên video)
export function MobilePlaylistToggle() {
  const { togglePlaylist, isMobile } = useUIStore();
  const { playlist, playlistLength } = usePlaylistStore();

  return (
    <>
      {isMobile && playlist !== null && (
        <button
          className={styles.mobilePlaylistToggle}
          onClick={togglePlaylist}
        >
          📋 {playlistLength}
        </button>
      )}
    </>
  );
}

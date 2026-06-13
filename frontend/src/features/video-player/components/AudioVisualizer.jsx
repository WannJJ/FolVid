import { useVideoStore } from "@/stores/useVideoStore";
import { usePlayer } from "../contexts/PlayerContext";
import styles from "./AudioVisualizer.module.css";

export function AudioVisualizer() {
  const { isPlaying } = usePlayer();
  const { currentVideo } = useVideoStore();
  return (
    <div className={styles.audioVisualizer}>
      <div className={styles.marqueeTrack}>
        {/* Hiển thị đơn giản cho file mp3 */}
        <span
          className={`${styles.marqueeText} ${isPlaying ? styles.active : ""}`}
        >
          🎵 {currentVideo.filename}
        </span>
      </div>
    </div>
  );
}

import { useVideoStore } from "@/stores/useVideoStore";
import styles from "./AudioVisualizer.module.css";

export function AudioVisualizer() {
  const { currentVideo } = useVideoStore();
  return (
    <div className={styles.audioVisualizer}>
      <div className={styles.marqueeTrack}>
        {/* Hiển thị đơn giản cho file mp3 */}
        <span className={styles.marqueeText}>🎵 {currentVideo.filename}</span>
      </div>
    </div>
  );
}

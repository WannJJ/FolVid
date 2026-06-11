import { API_BASE_URL } from "@/config/api";
import styles from "./VideoPlayer.module.css";

export function VideoCanvas({
  videoRef,
  currentVideo,
  togglePlay,
  setIsPlaying,
  setFx,
  saveState,
  handleTimeUpdate,
  handleLoadedMeta,
}) {
  return (
    <video
      ref={videoRef}
      src={`${API_BASE_URL}/videos/${encodeURIComponent(currentVideo.filename)}`} // encodeURI: phòng khi file có dấu cách/ký tự đặc biệt
      autoPlay
      onClick={togglePlay} // Toggle play/pause
      onPlay={() => {
        setIsPlaying(true); // Trình duyệt báo để hiện nút Play/Pause cho đúng
        setFx({
          type: "play",
          trigger: Date.now(),
        });
      }}
      onPause={() => {
        setIsPlaying(false); // Trình duyệt báo dừng để hiện nút Play/Pause cho đúng
        saveState();
        setFx({
          type: "pause",
          trigger: Date.now(),
        });
      }}
      onTimeUpdate={handleTimeUpdate} // Cập nhật liên tục khi video chạy
      onLoadedMetadata={handleLoadedMeta} // Khi video load xong, lấy duration
      className={styles.videoPlayer}
    />
  );
}

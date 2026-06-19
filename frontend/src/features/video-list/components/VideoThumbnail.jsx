import { API_BASE_URL } from "@/config/api";
import usePlaylistStore from "@/stores/usePlaylistStore";
import { formatTime } from "@/utils/formatTime";
import { Film, Music } from "lucide-react";
import { useRef, useState } from "react";
import ThumbnailPreview from "./ThumbnailPreview";
import styles from "./VideoListItem.module.css";

export function VideoThumbnail({ v, filename, thumb, duration, isAudio }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const { playlist, isInPlaylist } = usePlaylistStore();
  const inPlaylist = isInPlaylist(v.filename);

  // Luôn tính URL để video render ngay từ đầu (ref được gán)
  const videoUrl = new URL(
    `/videos/${encodeURIComponent(filename)}`,
    API_BASE_URL,
  ).href;

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={styles.thumbWrap}
    >
      {/* === LỚP 1: Thumbnail ảnh hoặc icon 🎵 === */}
      {/* Hiện khi KHÔNG hover, hoặc khi video chưa load xong */}
      <div
        className={styles.thumbContainer}
        style={{
          opacity: isHovered ? 0 : 1, // Ẩn khi hover
        }}
      >
        {thumb ? (
          <img
            className={styles.thumbImage}
            src={`${API_BASE_URL}${thumb}`}
            alt={filename}
            loading="lazy"
          />
        ) : (
          <div className={styles.thumbFallback}>
            {isAudio ? <Music /> : <Film />}
          </div>
        )}
      </div>

      {/* === LỚP 2: Video preview === */}
      {/* Luôn render (để ref được gán), nhưng ẩn bằng opacity */}
      <ThumbnailPreview
        videoRef={videoRef}
        videoSrc={videoUrl}
        isHovered={isHovered}
        isAudio={v.type === "audio"}
      />

      {/* Chỉ hiện nút Add nếu đã có playlist */}
      {playlist !== null && (
        <button
          className={`${styles.btnAddPlaylist} ${inPlaylist ? styles.added : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!inPlaylist) {
              // addToPlaylist nhận videoObj
              usePlaylistStore.getState().addToPlaylist(v);
            }
          }}
          disabled={inPlaylist}
          title="add to playlist"
          aria-label="add to playlist"
        >
          {inPlaylist ? "✓" : "+"}
        </button>
      )}

      <div className={styles.duration}>{formatTime(duration)}</div>
    </div>
  );
}

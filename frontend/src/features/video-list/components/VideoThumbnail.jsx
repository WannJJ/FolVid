import { API_BASE_URL } from "@/config/api";
import { formatTime } from "@/utils/formatTime";
import { useRef, useState } from "react";
import ThumbnailPreview from "./ThumbnailPreview";
import styles from "./VideoListItem.module.css";

export function VideoThumbnail({ filename, thumb, duration }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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
            {filename.endsWith(".mp3") ? "🎵" : "🎬"}
          </div>
        )}
      </div>

      {/* === LỚP 2: Video preview === */}
      {/* Luôn render (để ref được gán), nhưng ẩn bằng opacity */}
      <ThumbnailPreview
        videoRef={videoRef}
        videoSrc={videoUrl}
        isHovered={isHovered}
      />
      {/*
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isHovered ? 1 : 0, // Hiện khi hover
          transition: "opacity 0.15s ease",
          zIndex: 2,
          pointerEvents: "none", // Để click xuyên qua video
        }}
      />
      */}

      <div className={styles.duration}>{formatTime(duration)}</div>
    </div>
  );
}

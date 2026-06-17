import { API_BASE_URL } from "@/config/api";
import { useStoryboard } from "@/hooks/useStoryboard";
import { useVideoStore } from "@/stores/useVideoStore";
import { formatTime } from "@/utils/formatTime";
import { useRef, useState } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import styles from "./Timeline.module.css";
export function Timeline() {
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);
  const [hover, setHover] = useState({ active: false, x: 0, time: 0 });
  const { videoRef, progress, setProgress } = usePlayer();
  const { currentVideo } = useVideoStore();
  const storyboard = useStoryboard(currentVideo);

  // Tua khi click vào thanh timeline
  const handleSeek = (e) => {
    const bar = timelineRef.current;
    if (!bar || !videoRef.current) return;

    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * videoRef.current.duration;

    videoRef.current.currentTime = newTime;
    setProgress(pos * 100);
  };
  const handleMouseMove = (e) => {
    const bar = timelineRef.current;
    if (!bar || !videoRef.current) return;

    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * videoRef.current.duration;

    setHover({ active: true, x: e.clientX - rect.left, time: newTime });

    if (!isDragging) {
      return;
    }

    handleSeek(e); // Gọi lại hàm tua
  };

  // Tìm frame phù hợp với thời gian hover
  const getFrame = (time) => {
    if (!storyboard?.frames) return null;
    return (
      storyboard.frames.find((f) => time >= f.start && time < f.end) ||
      storyboard.frames[storyboard.frames.length - 1]
    );
  };

  const frame = hover.active ? getFrame(hover.time) : null;

  return (
    <div
      className={styles.timelineContainer}
      ref={timelineRef}
      onClick={handleSeek}
      onMouseDown={() => setIsDragging(true)}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => {
        setIsDragging(false);
        setHover((h) => ({ ...h, active: false }));
      }}
    >
      <div className={styles.timelineTrack}>
        <div
          className={styles.timelineProgress}
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Thumb tròn nhỏ nằm trên đầu progress */}
      <div className={styles.timelineThumb} style={{ left: `${progress}%` }} />

      {/* Tooltip Preview */}
      {hover.active && frame && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: `${hover.x}px`,
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {/* Khung chứa thumbnail - overflow hidden để chỉ hiện 1 frame */}
          <div
            style={{
              width: `${frame.w}px`,
              height: `${frame.h}px`,
              overflow: "hidden",
              borderRadius: "4px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              border: "2px solid #fff",
              background: "#000", // fallback nếu ảnh chưa load
            }}
          >
            <img
              src={`${API_BASE_URL}${frame.sprite}`}
              alt="preview"
              loading="lazy"
              style={{
                width: "auto", // Giữ nguyên kích thước sprite gốc
                height: "auto",
                maxWidth: "none", // Quan trọng: không để img tự co lại
                transform: `translate(-${frame.x}px, -${frame.y}px)`,
                // Hoặc dùng margin âm nếu muốn:
                // marginLeft: `-${frame.x}px`,
                // marginTop: `-${frame.y}px`,
              }}
            />
          </div>

          {/* Thời gian */}
          <div
            style={{
              textAlign: "center",
              color: "#fff",
              fontSize: "12px",
              marginTop: "4px",
              background: "rgba(0,0,0,0.8)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {formatTime(hover.time)}
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import styles from "./Timeline.module.css";

export function Timeline({ videoRef, progress, setProgress }) {
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);
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
    if (!isDragging) return;
    handleSeek(e); // Gọi lại hàm tua
  };

  return (
    <div
      className={styles.timelineContainer}
      ref={timelineRef}
      onClick={handleSeek}
      onMouseDown={() => setIsDragging(true)}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className={styles.timelineTrack}>
        <div
          className={styles.timelineProgress}
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Thumb tròn nhỏ nằm trên đầu progress */}
      <div className={styles.timelineThumb} style={{ left: `${progress}%` }} />
    </div>
  );
}

import { API_BASE_URL } from "@/config/api";
import { formatTime } from "@/utils/formatTime";
import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";
import styles from "./VideoListItem.module.css";

export default function VideoListItem({
  v,
  isActive,
  onClick,
  onContextMenu,
  isEditingName,
  tempName,
  setTempName,
  confirmRename,
  cancelRename,
}) {
  const [ref, isInView] = useInView();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isInView) {
      // Khi đã lọt vào màn hình, delay 100ms rồi mới hiện tên video
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <li
      ref={ref}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`${styles.videoItem} ${isActive ? styles.active : ""}`}
    >
      {showContent ? (
        <>
          <div className={styles.thumbWrap}>
            {v.thumb ? (
              <img
                className={styles.thumbImage}
                src={`${API_BASE_URL}${v.thumb}`}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className={styles.thumbFallback}>
                {v.filename.endsWith(".mp3") ? "🎵" : "🎬"}
              </div>
            )}
            <div className={styles.duration}>{formatTime(v.duration)}</div>
          </div>

          <div className={styles.info}>
            {isEditingName ? (
              <>
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename(v.filename);
                    if (e.key === "Escape") cancelRename();
                  }}
                />
                <button
                  className={`${styles.actionBtn} ${styles.confirm}`}
                  onClick={() => confirmRename(v.filename)}
                >
                  ✓
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.cancel}`}
                  onClick={cancelRename}
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span>{v.filename}</span>
              </>
            )}
          </div>
        </>
      ) : (
        // Skeleton placeholder
        <div className={styles.skeleton} />
      )}
    </li>
  );
}

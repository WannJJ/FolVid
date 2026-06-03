import { API_BASE_URL } from "@/config/api";
import { formatTime } from "@/utils/formatTime";
import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";

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
      className={`video-item ${isActive ? "active" : ""}`}
    >
      {showContent ? (
        <>
          <div className="thumb-wrap">
            {v.thumb ? (
              <img
                className="thumb-image"
                src={`${API_BASE_URL}${v.thumb}`}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="thumb-fallback">
                {v.filename.endsWith(".mp3") ? "🎵" : "🎬"}
              </div>
            )}
            <div className="duration">{formatTime(v.duration)}</div>
          </div>

          <div className="info">
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
                  className="action-btn confirm"
                  onClick={() => confirmRename(v.filename)}
                >
                  ✓
                </button>
                <button className="action-btn cancel" onClick={cancelRename}>
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
        <div className="skeleton" />
      )}
    </li>
  );
}

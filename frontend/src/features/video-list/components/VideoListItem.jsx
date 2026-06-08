import { API_BASE_URL } from "@/config/api";
import { videoApi } from "@/services/videoApi";
import { formatTime } from "@/utils/formatTime";
import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";
import styles from "./VideoListItem.module.css";

export default function VideoListItem({
  v,
  currentVideo,
  setCurrentVideo,
  editingName,
  setEditingName,
  tempName,
  setTempName,
  fetchVideoList,
  setContextMenu,
  handleSelectVideo,
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

  const cancelRename = () => {
    setEditingName(null);
    setTempName("");
  };

  const confirmRename = async (oldName) => {
    if (!tempName || tempName === oldName) {
      cancelRename();
      return;
    }

    try {
      const res = await videoApi.rename(oldName, tempName);
      if (res.ok) {
        // Cập nhật lại danh sách
        const data = await fetchVideoList();
        // Nếu video đang phát bị đổi tên, cập nhật lại currentVideo
        if (currentVideo.filename === oldName) {
          const selectedVideo = data.find((e) => e.filename === tempName);
          if (selectedVideo) {
            setCurrentVideo(selectedVideo);
          }
        }
      } else {
        const err = await res.json();
        alert("Lỗi đổi tên: " + err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingName(null);
    }
  };

  const onContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: "listItem",
      target: v,
    });
  };

  return (
    <li
      ref={ref}
      onClick={() => handleSelectVideo(v)}
      onContextMenu={onContextMenu}
      className={`${styles.videoItem} ${currentVideo.filename === v.filename ? styles.active : ""}`}
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
            {editingName === v.filename ? (
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

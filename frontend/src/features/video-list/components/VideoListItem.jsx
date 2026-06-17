import { videoApi } from "@/services/videoApi";
import usePlaylistStore from "@/stores/usePlaylistStore";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";
import styles from "./VideoListItem.module.css";
import { VideoThumbnail } from "./VideoThumbnail";

export function VideoListItem({
  v,
  editingName,
  setEditingName,
  tempName,
  setTempName,
}) {
  const [ref, isInView] = useInView();
  const { openContextMenu, setSidebarOpen } = useUIStore();
  const { currentVideo, setCurrentVideo, fetchVideoList } = useVideoStore();
  const { playlist, addToPlaylist, isInPlaylist } = usePlaylistStore();
  const [showContent, setShowContent] = useState(false);

  const inPlaylist = isInPlaylist(v);

  useEffect(() => {
    if (isInView) {
      // Khi đã lọt vào màn hình, delay 100ms rồi mới hiện tên video
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  const handleSelectVideo = (v) => {
    if (editingName) return; // handleSelectVideo sẽ không hoạt động nếu đang editing name
    setCurrentVideo(v);
    setSidebarOpen(false); // Đóng sidebar sau khi chọn (trên mobile)
  };

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
    openContextMenu({
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
      className={`${styles.videoItem} ${currentVideo && currentVideo.filename === v.filename ? styles.active : ""}`}
    >
      {showContent ? (
        <>
          <VideoThumbnail
            filename={v.filename}
            thumb={v.thumb}
            duration={v.duration}
            isAudio={v.type === "audio"}
          />

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

          {/* Chỉ hiện nút Add nếu đã có playlist */}
          {playlist !== null && (
            <button
              className={`btn-add-playlist ${inPlaylist ? "added" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!inPlaylist) addToPlaylist(v);
              }}
              disabled={inPlaylist}
            >
              {inPlaylist ? "✓" : "+"}
            </button>
          )}
        </>
      ) : (
        // Skeleton placeholder
        <div className={styles.skeleton} />
      )}
    </li>
  );
}

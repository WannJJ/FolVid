// src/features/playlist/PlaylistItem.jsx
import { videoApi } from "@/services/videoApi";
import { formatSize } from "@/utils/formatSize";
import { formatTime } from "@/utils/formatTime";
import { useState } from "react";
import styles from "./PlaylistPanel.module.css";

export function PlaylistItem({
  video,
  index,
  isPlaying,
  isCollapsed,
  onPlay,
  onRemove,
  onReorder,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== index) {
      onReorder(fromIndex, index);
    }
  };

  // Khi collapsed: chỉ hiện icon nhỏ
  if (isCollapsed) {
    return (
      <div
        className={`${styles.playlistItemCollapsed} ${isPlaying ? styles.playing : ""}`}
        onClick={onPlay}
        title={video.filename}
      >
        {isPlaying ? "▶" : `${index + 1}`}
      </div>
    );
  }

  return (
    <div
      className={`${styles.playlistItem} ${isPlaying ? styles.playing : ""} ${isDragging ? styles.dragging : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onPlay}
    >
      <span className={styles.dragHandle}>⋮⋮</span>

      {/* Thumbnail */}
      {video.thumb ? (
        <img
          src={videoApi.getThumbnailSrc(video.thumb)}
          alt=""
          className={styles.playlistThumb}
        />
      ) : (
        <div className={styles.playlistThumb} />
      )}

      <div className={styles.playlistItemInfo}>
        <span className={styles.videoName}>
          {isPlaying ? "▶ " : `${index + 1}. `}
          {video.filename}
        </span>
        <span className={styles.videoMeta}>
          {video.duration && formatTime(video.duration)}
          {video.duration && video.size && " • "}
          {video.size && formatSize(video.size)}
        </span>
      </div>

      <button
        className={styles.btnRemove}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ✕
      </button>
    </div>
  );
}

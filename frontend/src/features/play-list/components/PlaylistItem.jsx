// src/features/playlist/PlaylistItem.jsx
import { useState } from "react";

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
        className={`playlist-item-collapsed ${isPlaying ? "playing" : ""}`}
        onClick={onPlay}
        title={video.filename}
      >
        {isPlaying ? "▶" : `${index + 1}`}
      </div>
    );
  }

  return (
    <div
      className={`playlist-item ${isPlaying ? "playing" : ""} ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onPlay}
    >
      <span className="drag-handle">⋮⋮</span>

      {video.thumb && (
        <img src={video.thumb} alt="" className="playlist-thumb" />
      )}

      <div className="playlist-item-info">
        <span className="video-name">
          {isPlaying ? "▶ " : `${index + 1}. `}
          {video.filename}
        </span>
        <span className="video-meta">
          {video.duration && formatDuration(video.duration)}
          {video.duration && video.size && " • "}
          {video.size && formatSize(video.size)}
        </span>
      </div>

      <button
        className="btn-remove"
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

function formatDuration(seconds) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
}
